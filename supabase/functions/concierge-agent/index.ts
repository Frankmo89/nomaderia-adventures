// supabase/functions/concierge-agent/index.ts
// Nomaderia Adventures — Concierge IA con RAG + Datos en Vivo + motor de ranking
//
// Flujo:
//   1. Recibe pregunta del usuario
//   2. Carga destinos publicados (park_code → título/slug) y resuelve la guía abierta
//   3. Convierte pregunta a embedding y busca chunks en knowledge_chunks (pgvector)
//   4. Carga datos en vivo de park_live_data (incl. alias kica→seki)
//   5. GPT-4o-mini responde; en modo global puede llamar la herramienta
//      recommend_parks, que corre el motor vendorizado (_shared/engine) sobre los
//      destinos publicados — contrato upstream docs/engine-contract.md §6
//   6. Revisión de la respuesta: solo puede nombrar parques que devolvió el
//      motor, el de la guía abierta o los que nombró el usuario. Si no, se
//      regenera una vez; si sigue fallando, respuesta fija desde el motor.
//   7. Escala a WhatsApp si no hubo contexto ni motor
//
// Input:  { question: string, destination_slug?: string }   (single-turn: sin historial)
// Output: { answer, sources, escalate, whatsapp_url?, engine_version, recommendations? }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import {
  InvalidProfileError,
  recommend,
  type EngineData,
  type RecommendResult,
  type TripProfile,
} from "../_shared/engine/engine.ts";
import { ENGINE_DATA } from "../_shared/engine/engine-data.generated.ts";
import {
  describeEmptyEs,
  describeResultEs,
  engineDataForParkCodes,
  fallbackAnswerEs,
  toRecommendationEs,
  type ConciergeRecommendation,
  type ParkDisplay,
} from "../_shared/engine-es.ts";
import { buildParkNameIndex, findParkMentions, findUnbackedParks, type ParkNameIndex } from "../_shared/park-mentions.ts";

// ─── Config ───────────────────────────────────────────────────────────────────
const OPENAI_KEY   = Deno.env.get("OPENAI_API_KEY")!;
const SUPA_URL     = Deno.env.get("SUPABASE_URL")!;
const SUPA_ANON    = Deno.env.get("SUPABASE_ANON_KEY")!;
const WHATSAPP_NUM = "18588996802";
const SITE_URL     = "https://nomaderia.com";
const EMBED_MODEL  = "text-embedding-3-small";
const CHAT_MODEL   = "gpt-4o-mini";
const MAX_CHUNKS     = 6;   // chunks de contexto que se pasan al agente
const MIN_SIMILARITY = 0.4; // umbral mínimo de relevancia
const MAX_TOOL_ROUNDS = 2;  // 1 llamada + 1 reintento si el perfil fue inválido
const DEFAULT_K = 3;
const MAX_K     = 5;

// FIX 1 — live-data park aliases.
// NPS publishes live data (entrance fees, alerts, campgrounds) for some adjacent
// parks under a SINGLE shared park_code. Our editorial `destinations` keep
// separate codes per park, so park_live_data has no row under the editorial code.
// Map those editorial codes to the code NPS actually uses for live data.
//   - Kings Canyon ("kica") shares Sequoia's live data under "seki" (verified:
//     the "kica" park_live_data row is empty; all fees live under "seki").
//   - "sequ" is defensive only — no destination currently uses it, but if Sequoia
//     were ever re-coded it would resolve here too.
// This aliases ONLY the live-data lookup; RAG chunk retrieval still uses the
// editorial park_code unchanged.
const LIVE_DATA_PARK_ALIAS: Record<string, string> = {
  kica: "seki",
  sequ: "seki",
};

// Parks NPS administers jointly: a guide open on one may name the other.
const JOINT_PARKS: Record<string, string[]> = {
  seki: ["kica"],
  kica: ["seki"],
};

// Guide sections whose content is time-sensitive. They are editorial snapshots,
// not live data, so the model must present them as "según nuestra guía" and
// send people to nps.gov (contract §6.4).
const TIME_SENSITIVE_SECTIONS = new Set(["seasonal_closures", "zone_closures", "special_dates", "weather"]);

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Source {
  title:   string;
  slug:    string;
  section: string;
  url:     string;
}

interface KnowledgeChunk {
  id:          string;
  content:     string;
  metadata:    { slug?: string; title?: string; section?: string; park_code?: string; park_title?: string };
  source_table: string;
  source_field: string;
  similarity:  number;
}

interface ParkLiveRow {
  park_code:     string;
  entrance_fees: Array<{ cost: string; title: string; description: string }> | null;
  alerts:        Array<{ id: string; title: string; description: string; category: string; url: string }> | null;
  campgrounds:   Array<{ facilityId: string; nombre: string; reservation_url: string }> | null;
  synced_at:     string;
}

interface PublishedDestination {
  park_code: string | null;
  slug:      string;
  title:     string;
}

interface ToolCall {
  id:       string;
  type:     "function";
  function: { name: string; arguments: string };
}

interface ChatMessage {
  role:          "system" | "user" | "assistant" | "tool";
  content:       string | null;
  tool_calls?:   ToolCall[];
  tool_call_id?: string;
}

interface EngineRun {
  result:  RecommendResult;
  profile: TripProfile;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Construye URL de WhatsApp con mensaje prellenado */
function buildWhatsAppUrl(question: string, context?: string): string {
  const msg = context
    ? `Hola Frank, vengo del asistente de Nomaderia. ${context}\n\nMi pregunta: ${question}`
    : `Hola Frank, tengo una pregunta sobre Nomaderia: ${question}`;
  return `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`;
}

/** Detecta si la pregunta requiere intervención humana */
function shouldEscalate(question: string): boolean {
  const triggers = [
    "reservar", "reserva", "pagar", "pago", "precio", "costo", "cuánto cuesta",
    "permiso", "permit", "disponibilidad", "fecha", "disponible",
    "visa", "frontera", "cruzar",
    "médico", "salud", "condición", "enfermedad", "embarazada",
    "comprar", "contratar", "itinerario personalizado",
  ];
  const lower = question.toLowerCase();
  return triggers.some((t) => lower.includes(t));
}

/** Convierte una pregunta a embedding */
async function embedQuery(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  if (!res.ok) throw new Error(`OpenAI embedding error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.data[0].embedding;
}

/**
 * Deduplica fuentes por slug+section.
 * ingest-knowledge guarda `park_code` pero NO `slug` en metadata, así que el
 * slug se resuelve desde `destinations` (slugByCode). Sin esto, `sources`
 * salía siempre vacío.
 */
function deduplicateSources(chunks: KnowledgeChunk[], slugByCode: Map<string, string>): Source[] {
  const seen = new Set<string>();
  const sources: Source[] = [];
  for (const chunk of chunks) {
    const slug = chunk.metadata.slug
      ?? (chunk.metadata.park_code ? slugByCode.get(chunk.metadata.park_code) : undefined);
    const key = `${slug}-${chunk.metadata.section}`;
    if (!seen.has(key) && slug) {
      seen.add(key);
      const isDestination = chunk.source_table === "destinations";
      sources.push({
        title:   chunk.metadata.title  ?? "Nomaderia",
        slug,
        section: chunk.metadata.section ?? chunk.source_field,
        url:     isDestination
          ? `${SITE_URL}/destinos/${slug}`
          : `${SITE_URL}/gear/${slug}`,
      });
    }
  }
  return sources;
}

/** nps.gov page for a park: engine catalog URL, else the standard pattern. */
function npsUrlFor(parkCode: string): string {
  return ENGINE_DATA.catalog.find((p) => p.park_code === parkCode)?.nps_url
    ?? `https://www.nps.gov/${parkCode}/`;
}

// ─── Live data helpers ────────────────────────────────────────────────────────

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatDateEs(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getUTCDate()} ${MONTHS_ES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function isStale(syncedAt: string): boolean {
  return (Date.now() - new Date(syncedAt).getTime()) > 7 * 24 * 60 * 60 * 1000;
}

/** Builds the DATOS EN VIVO block injected into the system prompt */
function buildLiveDataBlock(liveRows: ParkLiveRow[], parkTitles: Map<string, string>): string {
  const singlePark = liveRows.length === 1;

  const parkBlocks = liveRows.map(row => {
    const title   = parkTitles.get(row.park_code) ?? row.park_code;
    const dateStr = formatDateEs(row.synced_at);
    const stale   = isStale(row.synced_at);

    // Entrance fees — each fee item is a DISTINCT, clearly-labeled line so the
    // model never merges them (e.g. confusing the $20 "Per Person" entry with
    // the $100 "Nonresident" surcharge — the bug this fixes).
    const fees = row.entrance_fees ?? [];
    const titleHas = (f: { title?: string }, s: string) =>
      (f.title ?? '').toLowerCase().includes(s);

    // (1) Standard per-vehicle entry (private vehicle, 7 days) — excludes commercial.
    const vehicleFee = fees.find(f => titleHas(f, 'vehicle') && !titleHas(f, 'commercial'))
      ?? fees[0];
    const vehicleAmount = vehicleFee ? parseFloat(vehicleFee.cost) : NaN;
    const vehicleLine = Number.isFinite(vehicleAmount) && vehicleAmount > 0
      ? `- Entrada por vehículo (7 días): $${vehicleAmount.toFixed(0)}`
      : '- Entrada por vehículo: dato no disponible';

    // (2) Standard per-person entry (on foot / bike) — excludes commercial & nonresident.
    const perPersonFee = fees.find(f =>
      (titleHas(f, 'per person') || titleHas(f, 'per-person')) &&
      !titleHas(f, 'commercial') && !titleHas(f, 'nonresident') && !titleHas(f, 'non-resident')
    );
    const perPersonAmount = perPersonFee ? parseFloat(perPersonFee.cost) : NaN;
    const perPersonLine = Number.isFinite(perPersonAmount) && perPersonAmount > 0
      ? `- Entrada por persona a pie o bici (7 días): $${perPersonAmount.toFixed(0)}`
      : '';

    // (3) Nonresident surcharge — answers "soy mexicano, ¿pago más?". Matched
    // SPECIFICALLY by TITLE (not description: other fees mention "nonresident"
    // in their description and would be picked up by mistake — that was the bug).
    const nonresFee = fees.find(f => titleHas(f, 'nonresident') || titleHas(f, 'non-resident'));
    const nonresAmount = nonresFee ? parseFloat(nonresFee.cost) : NaN;
    const nonresLine = Number.isFinite(nonresAmount) && nonresAmount > 0
      ? `- Tarifa de NO-RESIDENTE (adicional a la entrada base): $${nonresAmount.toFixed(0)} por persona, 16 años o más`
      : '';

    // Alerts (max 3, title only). A synced snapshot, not "right now" (§6.4).
    const allAlerts  = row.alerts ?? [];
    const shownAlerts = allAlerts.slice(0, 3);
    const alertsLine  = shownAlerts.length > 0
      ? `- Alertas NPS al ${dateStr} (${allAlerts.length}): ${shownAlerts.map(a => a.title).join(' · ')}`
      : `- Alertas: NPS no reportaba alertas activas al ${dateStr}`;

    // Campgrounds (max 3, with reservation URL)
    const shownCamps = (row.campgrounds ?? []).slice(0, 3);
    const campsLine  = shownCamps.length > 0
      ? `- Campamentos con reserva: ${shownCamps.map(c => `${c.nombre} (${c.reservation_url})`).join(', ')}`
      : '';

    const staleWarning = stale
      ? `⚠️ Datos no actualizados desde hace más de 7 días — verifica en nps.gov`
      : '';

    const parkHeader = singlePark
      ? `🏕️ ${title}`
      : `🏕️ ${title} (verificado: ${dateStr})`;

    const officialLine = `- Liga oficial para confirmar: ${npsUrlFor(row.park_code)}`;

    return [parkHeader, vehicleLine, perPersonLine, nonresLine, alertsLine, campsLine, officialLine, staleWarning]
      .filter(Boolean)
      .join('\n');
  });

  const headerDate = singlePark ? `(verificado: ${formatDateEs(liveRows[0].synced_at)}) ` : '';
  return `---\nDATOS EN VIVO ${headerDate}— sincronizados de NPS, pueden haber cambiado\n${parkBlocks.join('\n\n')}\n---`;
}

// ─── Motor de ranking (herramienta) ───────────────────────────────────────────

const RECOMMEND_TOOL = {
  type: "function",
  function: {
    name: "recommend_parks",
    description:
      "Motor de ranking de parques de Nomaderia. Úsalo SIEMPRE que el usuario pida que le recomiendes, compares o elijas parques. " +
      "Traduce lo que dijo a este perfil; NO elijas parques al llenarlo. " +
      "biomes: solo si nombra un tipo de lugar (desierto, costa, montaña → alpine, bosque lluvioso, cuevas…); si solo menciona actividades, []. " +
      "tags: 2–4 actividades. difficulty: con niños, papás o principiantes → easy; senderos moderados → moderate; mochileo o extenuante → challenging. " +
      "days_needed: un día → '1'; fin de semana → '2-3'; semana → '4-7'; más → '7+'. " +
      "crowd_pref: 'evitar multitudes' → low; si no lo dice, omítelo. budget_tier: solo si lo dice. " +
      "month: solo si da fecha o temporada (otoño → 10); si no, omítelo. " +
      "origin_lat/origin_lon/max_drive_hours: solo si da una ciudad o 'a N horas de…' (coordenadas aproximadas del centro de la ciudad). " +
      "allow_remote false: 'sin vuelos' o 'solo EE.UU. continental'. allow_permits false: 'sin permisos' o 'sin entrada con horario'. " +
      "No inventes restricciones que el usuario no dijo.",
    parameters: {
      type: "object",
      properties: {
        biomes:          { type: "array", items: { type: "string", enum: ENGINE_DATA.vocab.biomes } },
        tags:            { type: "array", items: { type: "string", enum: ENGINE_DATA.vocab.tags } },
        difficulty:      { type: "string", enum: Object.keys(ENGINE_DATA.ordinals.difficulty) },
        days_needed:     { type: "string", enum: Object.keys(ENGINE_DATA.ordinals.days) },
        crowd_pref:      { type: "string", enum: Object.keys(ENGINE_DATA.ordinals.crowd) },
        budget_tier:     { type: "string", enum: Object.keys(ENGINE_DATA.ordinals.budget) },
        month:           { type: "integer", minimum: 1, maximum: 12 },
        origin_lat:      { type: "number" },
        origin_lon:      { type: "number" },
        max_drive_hours: { type: "number", exclusiveMinimum: 0 },
        allow_remote:    { type: "boolean" },
        allow_permits:   { type: "boolean" },
        k:               { type: "integer", minimum: 1, maximum: MAX_K },
      },
      required: ["biomes", "tags"],
      additionalProperties: false,
    },
  },
} as const;

/** Tool arguments → TripProfile. Only contract §1 fields pass; the engine validates enums. */
function toProfile(args: Record<string, unknown>): { profile: TripProfile; k: number } {
  const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  const optString = (v: unknown) => (typeof v === "string" ? v : undefined);
  const optNumber = (v: unknown) =>
    typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)) ? Number(v) : null;
  const optBool = (v: unknown) => (typeof v === "boolean" ? v : undefined);

  const profile: TripProfile = {
    biomes:          strings(args.biomes),
    tags:            strings(args.tags),
    difficulty:      optString(args.difficulty),
    days_needed:     optString(args.days_needed),
    crowd_pref:      optString(args.crowd_pref),
    budget_tier:     optString(args.budget_tier),
    month:           optNumber(args.month),
    origin_lat:      optNumber(args.origin_lat),
    origin_lon:      optNumber(args.origin_lon),
    max_drive_hours: optNumber(args.max_drive_hours),
    allow_remote:    optBool(args.allow_remote),
    allow_permits:   optBool(args.allow_permits),
  };
  const k = typeof args.k === "number" && Number.isInteger(args.k) ? Math.min(Math.max(args.k, 1), MAX_K) : DEFAULT_K;
  return { profile, k };
}

/** Runs recommend_parks. Returns what the model reads, plus the run when it produced parks. */
function runRecommendTool(
  rawArgs: string,
  scoped: EngineData,
  displayByCode: Map<string, ParkDisplay>,
): { content: string; run: EngineRun | null } {
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(rawArgs || "{}");
  } catch {
    return { content: "ERROR DE PERFIL: los argumentos no son JSON válido. Vuelve a llamar la herramienta.", run: null };
  }
  const { profile, k } = toProfile(args);
  try {
    const result = recommend(scoped, profile, k);
    if (result.empty) return { content: describeEmptyEs(profile), run: null };
    return { content: describeResultEs(result, profile, displayByCode, SITE_URL), run: { result, profile } };
  } catch (err) {
    if (err instanceof InvalidProfileError) {
      return { content: `ERROR DE PERFIL: ${err.message}. Corrige ese campo y vuelve a llamar la herramienta.`, run: null };
    }
    throw err;
  }
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT_BASE = `Eres el asistente de aventuras de Nomaderia, un servicio de concierge en español para hispanos en EE.UU. que quieren hacer su primer viaje de senderismo. Frank Molina, agente TAP certificado, es quien respalda toda la información.

REGLAS ESTRICTAS:
1. Responde SIEMPRE en español, tono amigable y directo, como un amigo experto.
2. Usa ÚNICAMENTE la información del CONTEXTO, de los DATOS EN VIVO y del resultado de la herramienta. No inventes nada.
3. Si no tienes suficiente información para responder bien, dilo honestamente: "No tengo esa información específica, pero Frank puede ayudarte."
4. Sé concreto: da datos reales del contexto (distancias, alturas, días, precios de equipo, etc.).
5. Al final de tu respuesta incluye las fuentes relevantes en formato: [Fuente: título - sección].
6. Máximo 3 párrafos. Respuestas claras y útiles, no largas.

DATOS VIVOS — REGLAS IMPORTANTES:
- Para precios de entrada, alertas y reservas de campamentos, usa ÚNICAMENTE el bloque DATOS EN VIVO (si está disponible).
- Cada vez que des una tarifa o una alerta, di la fecha de verificación y agrega la liga oficial de nps.gov del bloque: son datos sincronizados que pueden haber cambiado.
- Cada línea de tarifa del bloque DATOS EN VIVO es DISTINTA y NO se combina ni se sustituye una por otra. Son tarifas separadas: "Entrada por vehículo", "Entrada por persona" y "Tarifa de NO-RESIDENTE".
- Cuando te pregunten por el recargo de NO-RESIDENTE o de extranjero (p. ej. "soy mexicano, ¿pago más?"), usa EXCLUSIVAMENTE la línea etiquetada "Tarifa de NO-RESIDENTE". NUNCA respondas ese recargo con la tarifa "por persona" ni con ninguna otra tarifa de entrada.
- NO hay datos en vivo de cierres, clima ni estado de caminos. Si el CONTEXTO los menciona (marcado GUÍA EDITORIAL), preséntalo como "según nuestra guía (puede haber cambiado)" y remite a nps.gov.
- Si los datos vivos no existen, dilo con honestidad y dirige al usuario a nps.gov.
- Nunca inventes precios ni fechas. Honestidad sobre completitud.

NUNCA:
- Inventes requisitos de visa, permisos, precios o disponibilidades específicas.
- Recomiendes marcas o productos que no estén en el contexto.
- Digas que puedes hacer reservas o procesar pagos.
- Recomiendes senderos específicos como si fueran una recomendación del motor: el motor recomienda parques, no senderos.`;

const ENGINE_RULES = `MOTOR DE RANKING (herramienta recommend_parks) — REGLAS DURAS:
- Si el usuario pide que le recomiendes, compares o elijas parques ("¿a dónde voy?", "¿qué parque para…?"), llama a recommend_parks. Nunca recomiendes parques por tu cuenta ni a partir del CONTEXTO.
- Solo puedes nombrar parques que devolvió la herramienta o que el usuario nombró en su pregunta. Ningún otro, ni como "también podrías…".
- Explica cada opción con el "Por qué encaja" y los "Rasgos" del resultado, en lenguaje llano. El % de compatibilidad es un puntaje de ajuste, nunca una probabilidad. No cites ningún otro número del motor.
- Si el resultado marca EMPATE TÉCNICO, preséntalos como una decisión cercana; no inventes un favorito.
- Si la herramienta responde SIN RESULTADOS, pregunta al usuario cuál de esos filtros quiere aflojar. No sugieras parques.
- Tiempos de manejo: siempre "aprox." (estimación por carretera, no Google Maps).
- Cierres, tarifas, alertas, clima, estado de caminos y permisos cambian a diario: para los parques recomendados, remite a su liga oficial de nps.gov.
- Si la herramienta responde ERROR DE PERFIL, corrige el campo y vuelve a llamarla.`;

const OUTPUT_FORMAT = `FORMATO DE SALIDA: responde SOLO con un objeto JSON:
{"answer": "<tu respuesta en español, con las fuentes al final>", "parks_mentioned": ["<park_code de cada parque que nombras>"]}
Los park_code vienen del resultado de la herramienta o de la guía abierta. Si no nombras parques, usa [].`;

function buildSystemPrompt(opts: {
  destinationSlug?: string;
  parkTitle?: string;
  parkCode?: string;
  liveDataBlock?: string;
}): string {
  let prompt = SYSTEM_PROMPT_BASE;

  if (opts.destinationSlug) {
    const parkLabel = opts.parkTitle ?? opts.destinationSlug;
    prompt += `\n\nIMPORTANTE — MODO PARQUE ESPECÍFICO:
El usuario está leyendo la guía de ${parkLabel}${opts.parkCode ? ` (park_code: ${opts.parkCode})` : ""}. Distingue DOS casos y NO los confundas:

(A) SCOPE — la pregunta es claramente de OTRO parque/destino o totalmente fuera de tema (p. ej. "¿qué tan lejos está Yosemite?", otro parque por nombre, o "¿qué otro parque me recomiendas?"). SOLO en ese caso responde exactamente:
"Me enfoco solo en este parque. Para otras preguntas, Frank puede ayudarte."

(B) SIN DATOS — la pregunta SÍ es sobre ${parkLabel} pero ni el CONTEXTO ni los DATOS EN VIVO la cubren (p. ej. uso horario, tours, un detalle que falta). Responde:
"No tengo esa información específica sobre ${parkLabel}, pero Frank puede ayudarte."

REGLAS:
- Una pregunta sobre ${parkLabel} de la que simplemente no tienes datos es el caso (B), NUNCA el (A).
- Si el CONTEXTO o los DATOS EN VIVO SÍ contienen la respuesta, respóndela directamente y NUNCA antepongas ninguna de esas dos frases. No mezcles un descargo con una respuesta real.
- Los parques de la sección nearby_parks del CONTEXTO puedes mencionarlos solo como "cerca de aquí", nunca como recomendación.`;
  } else {
    prompt += `\n\n${ENGINE_RULES}`;
  }

  if (opts.liveDataBlock) {
    prompt += `\n\n${opts.liveDataBlock}`;
  }

  return `${prompt}\n\n${OUTPUT_FORMAT}`;
}

// ─── OpenAI chat ──────────────────────────────────────────────────────────────

async function chat(messages: ChatMessage[], withTools: boolean, toolChoice: "auto" | "none"): Promise<ChatMessage> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model:           CHAT_MODEL,
      max_tokens:      700,
      temperature:     0.3, // baja temperatura → respuestas más precisas, menos creativas
      response_format: { type: "json_object" },
      messages,
      ...(withTools ? { tools: [RECOMMEND_TOOL], tool_choice: toolChoice } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`GPT error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.choices[0].message as ChatMessage;
}

/** Final model output → { answer, parks_mentioned }. Tolerates a non-JSON reply. */
function parseAnswer(content: string | null): { answer: string; parksMentioned: string[] } {
  const raw = (content ?? "").trim();
  try {
    const parsed = JSON.parse(raw) as { answer?: unknown; parks_mentioned?: unknown };
    const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
    const parksMentioned = Array.isArray(parsed.parks_mentioned)
      ? parsed.parks_mentioned.filter((c): c is string => typeof c === "string")
      : [];
    return { answer, parksMentioned };
  } catch {
    return { answer: raw, parksMentioned: [] };
  }
}

function jsonResponse(body: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { question, destination_slug } = await req.json() as {
      question:          string;
      destination_slug?: string;
    };

    if (!question?.trim()) {
      return jsonResponse({ error: "Se requiere el campo 'question'" }, corsHeaders, 400);
    }

    const noInfoResponse = () =>
      jsonResponse({
        answer:         "No tengo información específica sobre eso en mi base de conocimiento. Frank puede ayudarte con los detalles.",
        sources:        [],
        escalate:       true,
        whatsapp_url:   buildWhatsAppUrl(question),
        engine_version: ENGINE_DATA.engine_version,
      }, corsHeaders);

    // ── 1. Detectar si requiere handoff inmediato ─────────────────────────────
    const needsEscalation = shouldEscalate(question);

    const supabase = createClient(SUPA_URL, SUPA_ANON);

    // ── 2. Destinos publicados: títulos/slugs para fuentes, links y el motor ──
    // El motor solo rankea destinos publicados (ADR-026) — nunca el catálogo
    // completo si el producto no ofrece ese parque.
    const { data: destRows } = await supabase
      .from("destinations")
      .select("park_code, slug, title")
      .eq("is_published", true)
      .returns<PublishedDestination[]>();
    const displayByCode = new Map<string, ParkDisplay>();
    const slugByCode = new Map<string, string>();
    for (const d of destRows ?? []) {
      if (!d.park_code) continue;
      const code = d.park_code.toLowerCase();
      displayByCode.set(code, { title: d.title, slug: d.slug });
      slugByCode.set(code, d.slug);
    }
    const nameIndex: ParkNameIndex = buildParkNameIndex([
      ...ENGINE_DATA.catalog.map((p) => ({ park_code: p.park_code, name: p.name })),
      ...[...displayByCode].map(([park_code, d]) => ({ park_code, name: d.title })),
    ]);

    // ── 3. Resolver el parque en contexto (si hay una guía abierta) ───────────
    // Se resuelve ANTES de la búsqueda para (a) pre-filtrar chunks por parque
    // (FIX 2) y (b) poder cargar datos en vivo aunque la búsqueda RAG vuelva
    // vacía (FIX 3).
    let contextParkCode:  string | null = null;
    let contextParkTitle: string | null = null;
    if (destination_slug) {
      const { data: destRow } = await supabase
        .from("destinations")
        .select("park_code, title")
        .eq("slug", destination_slug)
        .single();
      contextParkCode  = destRow?.park_code ?? null;
      contextParkTitle = destRow?.title ?? null;
    }
    const parkMode = Boolean(destination_slug);

    // ── 4. Búsqueda por similitud en knowledge_chunks ─────────────────────────
    // FIX 2: cuando hay parque en contexto, el pre-filtro por park_code vive
    // dentro de match_knowledge_chunks (parámetro filter_park_code), así la DB
    // devuelve los mejores chunks DENTRO del parque en vez de los globales.
    const queryEmbedding = await embedQuery(question);
    const { data: chunkData } = await supabase.rpc("match_knowledge_chunks", {
      query_embedding:  queryEmbedding,
      match_count:      MAX_CHUNKS,
      min_similarity:   MIN_SIMILARITY,
      filter_park_code: contextParkCode, // null → búsqueda global (comportamiento previo)
    });
    // En modo global, nearby_parks nombra otros parques como sugerencia — eso
    // sería recomendar sin el motor (§6.1), así que se descarta.
    const chunks: KnowledgeChunk[] = ((chunkData ?? []) as KnowledgeChunk[])
      .filter((c) => parkMode || c.source_field !== "nearby_parks");

    // ── 5. Cargar datos en vivo (ANTES de decidir si se escala) ───────────────
    // Datos volátiles (tarifas, alertas, campamentos) vienen EXCLUSIVAMENTE de
    // park_live_data — nunca de knowledge_chunks (ADR-013).
    const parkCodeMap = new Map<string, string>(); // park_code → park_title
    for (const chunk of chunks) {
      if (chunk.source_table === "destinations" && chunk.metadata.park_code) {
        parkCodeMap.set(
          chunk.metadata.park_code,
          chunk.metadata.park_title ?? chunk.metadata.title ?? chunk.metadata.park_code
        );
      }
    }
    // FIX 3: si hay guía abierta, asegura el parque en contexto aunque ningún
    // chunk lo haya aportado (p. ej. búsqueda vacía) → permite responder tarifas/
    // alertas desde datos en vivo en lugar de escalar.
    if (contextParkCode && !parkCodeMap.has(contextParkCode)) {
      parkCodeMap.set(contextParkCode, contextParkTitle ?? contextParkCode);
    }

    let liveDataBlock = "";
    if (parkCodeMap.size > 0) {
      // FIX 1: mapea cada park_code editorial al código que NPS usa para datos
      // en vivo (p. ej. kica → seki). El título de display se conserva.
      const queryCodeToTitle = new Map<string, string>(); // liveCode → park_title
      for (const [code, title] of parkCodeMap) {
        const liveCode = LIVE_DATA_PARK_ALIAS[code] ?? code;
        if (!queryCodeToTitle.has(liveCode)) queryCodeToTitle.set(liveCode, title);
      }

      const { data: liveRows, error: liveErr } = await supabase
        .from("park_live_data")
        .select("park_code, entrance_fees, alerts, campgrounds, synced_at")
        .in("park_code", [...queryCodeToTitle.keys()]);

      // Silently skip if table not yet deployed or query fails — live data is
      // informational and must not crash the concierge.
      if (!liveErr && liveRows?.length) {
        liveDataBlock = buildLiveDataBlock(liveRows as ParkLiveRow[], queryCodeToTitle);
      }
    }

    // En modo parque no hay herramienta: sin chunks ni datos en vivo no hay nada
    // que responder, así que se escala sin gastar una llamada al modelo.
    if (parkMode && !chunks.length && !liveDataBlock) {
      return noInfoResponse();
    }

    // ── 6. Construir contexto para el agente ──────────────────────────────────
    const context = chunks
      .map((c, i) => {
        const label = TIME_SENSITIVE_SECTIONS.has(c.source_field)
          ? " [GUÍA EDITORIAL: puede haber cambiado — confirmar en nps.gov]"
          : "";
        return `[${i + 1}] ${c.metadata.title ?? ""} — ${c.metadata.section ?? c.source_field}${label}\n${c.content}`;
      })
      .join("\n\n---\n\n");

    const messages: ChatMessage[] = [
      {
        role:    "system",
        content: buildSystemPrompt({
          destinationSlug: destination_slug,
          parkTitle:       contextParkTitle ?? undefined,
          parkCode:        contextParkCode ?? undefined,
          liveDataBlock,
        }),
      },
      {
        role:    "user",
        content: `CONTEXTO:\n${context || "(sin contexto de la guía)"}\n\nPREGUNTA DEL USUARIO:\n${question}`,
      },
    ];

    // ── 7. Respuesta + herramienta del motor (solo en modo global) ────────────
    // En modo parque se conserva la regla de alcance: "Me enfoco solo en este parque".
    const withTools = !parkMode;
    const scoped = engineDataForParkCodes(displayByCode.keys());
    let engineRun: EngineRun | null = null;
    let toolRounds = 0;
    let reply = await chat(messages, withTools, "auto");
    while (withTools && reply.tool_calls?.length && toolRounds < MAX_TOOL_ROUNDS) {
      toolRounds += 1;
      messages.push({ role: "assistant", content: reply.content ?? null, tool_calls: reply.tool_calls });
      for (const call of reply.tool_calls) {
        const out = call.function.name === "recommend_parks"
          ? runRecommendTool(call.function.arguments, scoped, displayByCode)
          : { content: `Herramienta desconocida: ${call.function.name}`, run: null };
        if (out.run) engineRun = out.run;
        messages.push({ role: "tool", tool_call_id: call.id, content: out.content });
      }
      reply = await chat(messages, withTools, toolRounds < MAX_TOOL_ROUNDS ? "auto" : "none");
    }

    // ── 8. Guardrail de escalación ────────────────────────────────────────────
    // Sin chunks, sin datos en vivo y sin motor, cualquier respuesta sería
    // inventada: se escala a Frank.
    if (!chunks.length && !liveDataBlock && toolRounds === 0) {
      return noInfoResponse();
    }

    // ── 9. Revisión: solo parques respaldados (§6.1) ──────────────────────────
    // Permitidos: los que devolvió el motor, el de la guía abierta (y su parque
    // conjunto), los que nombró el usuario, y en modo parque los de nearby_parks
    // (el prompt los limita a "cerca de aquí").
    const allowed = new Set<string>(findParkMentions(question, nameIndex));
    for (const p of engineRun?.result.parks ?? []) allowed.add(p.facts.park_code);
    if (contextParkCode) {
      allowed.add(contextParkCode);
      for (const code of JOINT_PARKS[contextParkCode] ?? []) allowed.add(code);
    }
    if (parkMode) {
      for (const c of chunks) {
        if (c.source_field === "nearby_parks") {
          for (const code of findParkMentions(c.content, nameIndex)) allowed.add(code);
        }
      }
    }

    let { answer, parksMentioned } = parseAnswer(reply.content);
    let unbacked = findUnbackedParks(answer, parksMentioned, allowed, nameIndex);
    let answerCheck: "ok" | "regenerated" | "fallback" = "ok";

    if (unbacked.length > 0 || !answer) {
      console.warn(`concierge-agent answer check: unbacked parks [${unbacked.join(", ")}]${answer ? "" : " (empty answer)"}; regenerating`);
      const names = unbacked.map((c) => displayByCode.get(c)?.title ?? c).join(", ");
      messages.push({ role: "assistant", content: reply.content ?? "" });
      messages.push({
        role:    "user",
        content: answer
          ? `CORRECCIÓN: tu respuesta nombra ${names}, que no están respaldados por el motor ni los nombró el usuario. Reescribe la respuesta completa sin mencionarlos. Mismo formato JSON.`
          : `CORRECCIÓN: tu respuesta quedó vacía. Responde la pregunta del usuario. Mismo formato JSON.`,
      });
      reply = await chat(messages, withTools, "none");
      ({ answer, parksMentioned } = parseAnswer(reply.content));
      unbacked = findUnbackedParks(answer, parksMentioned, allowed, nameIndex);
      answerCheck = "regenerated";

      if (unbacked.length > 0 || !answer) {
        console.warn(`concierge-agent answer check: still unbacked [${unbacked.join(", ")}] after regeneration; using fallback`);
        if (!engineRun) return noInfoResponse();
        answer = fallbackAnswerEs(engineRun.result, engineRun.profile, displayByCode, SITE_URL);
        answerCheck = "fallback";
      }
    }

    const sources = deduplicateSources(chunks, slugByCode);
    const run = engineRun;
    const recommendations: ConciergeRecommendation[] | undefined = run
      ? run.result.parks.map((p) => toRecommendationEs(p, run.profile, displayByCode, SITE_URL))
      : undefined;

    // ── 10. Responder ─────────────────────────────────────────────────────────
    return jsonResponse({
      answer,
      sources,
      escalate:       needsEscalation,
      whatsapp_url:   needsEscalation
        ? buildWhatsAppUrl(question, `Pregunté sobre: "${question}"`)
        : undefined,
      engine_version: ENGINE_DATA.engine_version,
      recommendations,
      answer_check:   answerCheck,
    }, corsHeaders);

  } catch (err) {
    console.error("concierge-agent error:", err);
    return jsonResponse({ error: String(err) }, corsHeaders, 500);
  }
});
