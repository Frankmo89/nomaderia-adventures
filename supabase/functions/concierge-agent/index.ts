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
//   7. Escala al quiz gratuito (+ captura de correo) si no hubo contexto ni motor
//
// ADR-036 (bilingüe + páginas NPS + tarjetas de seguridad):
//   - La pregunta (español) se traduce al inglés; se embeben las dos y se llama
//     match_knowledge_chunks dos veces con los mismos parámetros. Se fusiona por
//     id (mejor similitud), mismo umbral y top-8.
//   - knowledge_chunks ahora incluye páginas oficiales de nps.gov (ingest-nps-pages)
//     con source_url / fetched_at / kind. La fecha "verificado" sale de fetched_at
//     del chunk citado, nunca de hoy.
//   - Seguridad: nunca se genera libremente. Si la pregunta es de seguridad se
//     agregan tarjetas NPS textuales (kind=safety) con fuente y fecha; si no hay,
//     "En una emergencia, llama al 911" + la página oficial de seguridad.
//   - Cuentas: herramienta calculate determinista (_shared/concierge-calc.ts).
//
// Producto: WhatsApp es solo para clientes que ya pagaron (botón propio en
// /i/:token). Este chat lo usan visitantes anónimos — nunca ofrece whatsapp_url;
// toda escalación apunta al quiz (/#quiz), con captura de correo en el frontend.
//
// Input:  { question: string, destination_slug?: string }   (single-turn: sin historial)
// Output: { answer, sources, escalate, quiz_url?, engine_version, recommendations? }

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
import {
  composeVisibleAnswer,
  CONCIERGE_MAX_PER_HOUR,
  greetingAnswer,
  isClearlyOutOfScope,
  isGreetingOnly,
  isSafetyTopic,
  outOfScopeAnswer,
  rateLimitAnswer,
  shouldAskEmail,
  immigrationAnswer,
  isImmigrationQuestion,
  unconfirmedAnswer,
  ungroundedNumbers,
} from "../_shared/concierge-guard.ts";
import { CALCULATE_TOOL, runCalculate } from "../_shared/concierge-calc.ts";
import { NPS_PARKS, shortDateEs } from "../_shared/nps-pages.ts";
import {
  CALCULATE_FEES_TOOL,
  computeFees,
  FEE_PARKS,
  feeFactsBlock,
  normalizeFeeRow,
  normalizePassRow,
  parseFeeInput,
  nextFreeDayNote,
  reviewFeeInput,
  statedToday,
  todayLineEs,
  todayPacific,
  type ParkFeeRow,
  type PassRuleRow,
} from "../_shared/park-fees.ts";
import { detectRuleIntents, diversifyChunks, pickRuleChunks } from "../_shared/retrieval-rules.ts";
import {
  isProductQuestion,
  PRODUCT_CARD_DATE_ES,
  PRODUCT_CARD_FETCHED_AT,
  PRODUCT_CARD_TEXT,
  PRODUCT_CARD_URL,
  productContextBlock,
} from "../_shared/product-card.ts";
import {
  detectSafetyTopics,
  formatSafetyCards,
  safetyFallback,
  SAFETY_TOPICS,
  type SafetyCard,
  type SafetyTopic,
} from "../_shared/safety-cards.ts";

// ─── Config ───────────────────────────────────────────────────────────────────
const OPENAI_KEY   = Deno.env.get("OPENAI_API_KEY")!;
const SUPA_URL     = Deno.env.get("SUPABASE_URL")!;
const SUPA_ANON    = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPA_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE_URL     = "https://nomaderia.com";
// Producto: WhatsApp es solo para clientes que ya pagaron (botón propio en
// /i/:token) — este chat nunca lo ofrece. Toda escalación de visitante apunta
// aquí; el frontend añade captura de correo junto a este link.
const QUIZ_URL     = "/#quiz";
const EMBED_MODEL  = "text-embedding-3-small";
const CHAT_MODEL   = "gpt-4o-mini";
const MAX_CHUNKS     = 8;   // chunks de contexto que se pasan al agente
const MIN_SIMILARITY = 0.4; // umbral mínimo de relevancia
const MAX_TOOL_ROUNDS = 2;  // 1 llamada + 1 reintento si el perfil fue inválido
const PER_SOURCE_MAX = 2;   // ADR-037: máx. 2 chunks por fuente (source_url) en el top-8
const RULE_PARKS_MAX = 2;   // parques para los chunks de reglas (cierres, dormir, permisos)
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
  /** "verificado 27 sep 2026" / "consultada 5 oct 2026" — from the chunk's fetched_at. */
  date?:   string;
}

interface KnowledgeChunk {
  id:          string;
  content:     string;
  metadata:    {
    slug?: string; title?: string; section?: string; park_code?: string; park_title?: string;
    source_url?: string; fetched_at?: string; kind?: string;
  };
  source_table: string;
  source_field: string;
  similarity:  number;
}

/** Columns added by ADR-036 (new query; match_knowledge_chunks is unchanged). */
interface ChunkSourceMeta {
  id:         string;
  source_url: string | null;
  fetched_at: string | null;
  kind:       string | null;
  park_code:  string | null;
}

interface SafetyCardRow {
  id:           string;
  content:      string;
  source_field: string;
  source_url:   string | null;
  fetched_at:   string | null;
  park_code:    string | null;
  metadata:     { verbatim?: string; es?: string | null; topic?: string } | null;
}

/**
 * Fee/pass questions: service-wide NPS pages (nonresident FAQ, passes; park_code
 * "nps") get up to NPS_WIDE_SLOTS of the top-8, since park pages crowd them out.
 */
const FEE_TOPIC = /recargo|no[- ]residente|extranjer|vivo en m[eé]xico|viven en m[eé]xico|\bpases?\b|\bpass\b|america the beautiful|tarifa|cu[aá]nto (cuesta|pago|pagan|paga|cobra)|\bcobra|entrada gratis|d[ií]as? (de entrada )?gratis|senior|descuento/i;
const NPS_WIDE_SLOTS = 3;

/** The question mentions people who live outside the U.S. (nonresident fee applies to them). */
const NONRESIDENT_HINT = new RegExp(
  String.raw`no[- ]residente|extranjer|turista|fuera de (ee\.?\s?uu|estados unidos)|otro pa[ií]s|` +
  String.raw`viv\w* en (m[eé]xico|guatemala|el salvador|honduras|nicaragua|costa rica|panam[aá]|colombia|venezuela|ecuador|per[uú]|bolivia|chile|argentina|uruguay|paraguay|cuba|rep[uú]blica dominicana|espa[nñ]a|canad[aá])|` +
  String.raw`\b(mexican|guatemaltec|salvadore[nñ]|hondure[nñ]|colombian|venezolan|peruan|argentin|chilen|cuban|dominican)[oa]s?\b`,
  "i",
);
const PASS_HINT = /\bpases?\b|america the beautiful|annual pass|pase anual/i;
/** Menciona un pase que SÍ tiene ("sin pase" / "no tenemos pase" no cuenta). */
function mentionsPass(question: string): boolean {
  return PASS_HINT.test(question.replace(/\b(sin|no\s+\w+)\s+(un\s+|el\s+|ningún\s+)?pases?\b/gi, ""));
}
const US_RESIDENT_HINT = /viv\w* en (ee\.?\s?uu|estados unidos|usa|los estados unidos)|soy residente|residente de (ee|estados)/i;

/** Official NPS page chunks written by ingest-nps-pages. */
const NPS_SOURCE_TABLES = new Set(["nps_pages", "nps_safety_cards"]);

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

/** Detecta si la pregunta requiere intervención humana (quiz + captura de correo, nunca WhatsApp) */
function shouldEscalate(question: string): boolean {
  const triggers = [
    "reservar", "reserva", "pagar", "pago", "precio", "costo", "cuánto cuesta",
    "permiso", "permit", "disponibilidad", "fecha", "disponible",
    "visa", "frontera", "cruzar",
    "médico", "salud", "condición", "enfermedad", "embarazada",
    "comprar", "contratar", "itinerario personalizado", "itinerario completo", "$49",
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

/** Embeds several texts in one call (same model as embedQuery). */
async function embedTexts(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
  });
  if (!res.ok) throw new Error(`OpenAI embedding error ${res.status}: ${await res.text()}`);
  const data = await res.json() as { data: Array<{ embedding: number[]; index: number }> };
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

/**
 * Spanish question → English, for matching the English nps.gov chunks.
 * Null on any failure: retrieval then runs with the Spanish embedding only.
 */
async function translateQuestionToEnglish(question: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CHAT_MODEL,
        temperature: 0,
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content:
              "Translate the user's question into English for a search over U.S. National Park Service web pages. " +
              "Keep park names, numbers and units exactly. Output only the translation.",
          },
          { role: "user", content: question.slice(0, 1000) },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const en = (data.choices?.[0]?.message?.content ?? "").trim();
    return en || null;
  } catch {
    return null;
  }
}

/** Merge two match_knowledge_chunks result sets: dedupe by id, keep best similarity, same threshold, top N. */
function mergeChunkResults(lists: KnowledgeChunk[][], minSimilarity: number, limit: number): KnowledgeChunk[] {
  const byId = new Map<string, KnowledgeChunk>();
  for (const list of lists) {
    for (const c of list) {
      const prev = byId.get(c.id);
      if (!prev || c.similarity > prev.similarity) byId.set(c.id, c);
    }
  }
  return [...byId.values()]
    .filter((c) => c.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/** Fetch/verification date of a chunk: fetched_at column, else metadata (NPS rows), else null. */
function chunkFetchedAt(c: KnowledgeChunk, meta: Map<string, ChunkSourceMeta>): string | null {
  return meta.get(c.id)?.fetched_at ?? c.metadata.fetched_at ?? null;
}

/** Sources for official NPS page chunks: the nps.gov URL, deduped by URL. */
function npsSourceOf(c: KnowledgeChunk, meta: Map<string, ChunkSourceMeta>): Source | null {
  if (!NPS_SOURCE_TABLES.has(c.source_table)) return null;
  const url = meta.get(c.id)?.source_url ?? c.metadata.source_url;
  if (!url) return null;
  const date = shortDateEs(chunkFetchedAt(c, meta));
  return {
    title:   c.metadata.title ?? "NPS",
    slug:    c.metadata.park_code ?? "nps",
    section: c.metadata.section ?? "página oficial (NPS)",
    url,
    date:    date ? `consultada ${date}` : undefined,
  };
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

/** Capitalized words that are not place names inside a park. */
const NOT_PLACES = new Set([
  "méxico", "mexico", "estados", "unidos", "america", "américa", "beautiful", "parque", "parques", "nacional",
  "nacionales", "frank", "nomaderia", "servicio", "california", "arizona", "nevada", "angeles", "ángeles",
  "diego", "francisco", "vegas", "tijuana", "whatsapp", "google", "national", "service", "hola", "gracias",
]);

/**
 * Parks of places the user named that are not park names ("Badwater", "Half Dome"):
 * a capitalized word from the question that appears verbatim in a retrieved chunk of
 * that park. Lets the answer name the park the user already pointed at.
 */
function namedPlaceParks(question: string, chunks: KnowledgeChunk[]): string[] {
  const words = new Set<string>();
  for (const m of question.matchAll(/(^|[^¿¡.?!\s]\s+)(\p{Lu}[\p{L}'’-]{3,})/gu)) {
    if (!NOT_PLACES.has(m[2].toLowerCase())) words.add(m[2]);
  }
  const parks: string[] = [];
  for (const word of words) {
    const re = new RegExp(`(^|[^\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "u");
    for (const c of chunks) {
      const code = c.metadata.park_code;
      if (code && code !== "nps" && !parks.includes(code) && re.test(c.content)) parks.push(code);
    }
  }
  return parks;
}

/** Editorial sources (dated from fetched_at) + official NPS sources, in retrieval order. */
function buildSources(chunks: KnowledgeChunk[], slugByCode: Map<string, string>, meta: Map<string, ChunkSourceMeta>): Source[] {
  const editorialChunks = chunks.filter((c) => !NPS_SOURCE_TABLES.has(c.source_table));
  const ranked: Array<{ rank: number; source: Source }> = [];
  for (const src of deduplicateSources(editorialChunks, slugByCode)) {
    const idx = chunks.findIndex((c) =>
      !NPS_SOURCE_TABLES.has(c.source_table) &&
      (c.metadata.slug ?? (c.metadata.park_code ? slugByCode.get(c.metadata.park_code) : undefined)) === src.slug &&
      (c.metadata.section ?? c.source_field) === src.section
    );
    const date = idx >= 0 ? shortDateEs(chunkFetchedAt(chunks[idx], meta)) : "";
    ranked.push({ rank: idx, source: date ? { ...src, date: `verificado ${date}` } : src });
  }
  const seenUrl = new Set<string>();
  chunks.forEach((c, idx) => {
    const src = npsSourceOf(c, meta);
    if (src && !seenUrl.has(src.url)) {
      seenUrl.add(src.url);
      ranked.push({ rank: idx, source: src });
    }
  });
  return ranked.sort((a, b) => a.rank - b.rank).map((r) => r.source);
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
3. Si el CONTEXTO y los DATOS EN VIVO no contienen el dato, responde exactamente: "Eso no lo tengo confirmado." No lo completes con conocimiento general.
4. Sé concreto solo con datos que estén en el contexto. No completes cifras de memoria.
5. No cierres tú la fuente: el sistema agrega "Fuente:" y la fecha al final. No escribas tú fechas de verificación o consulta.
6. Máximo 3 párrafos. Respuestas claras y útiles, no largas.
7. Cualquier cifra (precio, distancia, hora, fecha, edad, dosis) tiene que aparecer en el CONTEXTO, en DATOS EN VIVO o en el resultado del motor. Si no está, no la escribas.
8. En calor, agua, fauna, clima o emergencias no inventes cantidades ni des consejos de seguridad propios: di solo lo que diga el CONTEXTO. El sistema agrega la tarjeta oficial de seguridad del NPS y el aviso de llamar al 911.
9. Parte del CONTEXTO son PÁGINAS OFICIALES NPS en inglés: responde en español traduciendo fielmente, con las mismas cifras y unidades (no conviertas pies, millas, galones ni °F). Lee con cuidado a qué lugar exacto (isla, camino, sendero, alojamiento) se refiere cada alerta, cierre o fecha, y no la atribuyas a otro.
10. Si la respuesta requiere una cuenta (tarifas × personas, agua por persona × personas, sumas o diferencias), usa la herramienta calculate con UNA expresión que tenga la fórmula completa (todas las personas y todos los cargos), p. ej. (a + b) * n. Nunca hagas cuentas de memoria; escribe el resultado que devuelve. Antes de calcular, decide con la PÁGINA OFICIAL quién paga y qué cubre cada tarifa o pase (titular, pasajeros del vehículo, adultos adicionales, menores de 16), y solo entonces arma la fórmula con esas personas. Al comparar dos totales, resta el mayor menos el menor y di cuál sale más barato.
11. No uses listas numeradas; usa viñetas con «-».
12. TARIFAS DE ENTRADA: si hay bloque TARIFAS OFICIALES y la herramienta calculate_fees, úsala para CUALQUIER total o monto que pague una persona o un grupo (entrada, Tarifa de NO-RESIDENTE, si conviene un pase). No sumes tarifas a mano ni con calculate. Escribe el TOTAL que devuelve, explica en pocas palabras qué paga cada quien, y cita la liga de la fuente y la fecha de consulta que vienen en FUENTES. Si un parque NO cobra la Tarifa de NO-RESIDENTE, dilo claramente. Si devuelve ERROR, corrige los argumentos como dice y llámala otra vez; si aun así no puedes, responde "Eso no lo tengo confirmado." y da la liga oficial.
13. PRODUCTO: si hay TARJETA DE PRODUCTO en el CONTEXTO, responde la pregunta sobre el Itinerario Completo Nomaderia solo con lo que dice esa tarjeta (precio, qué incluye, entrega, cambios, pago, WhatsApp). El sistema agrega la tarjeta completa y su fuente al final (no escribas tú "Fuente:"). No digas que este chat cobra o reserva: el pago es con tarjeta en nomaderia.com.
14. Si el CONTEXTO trae una REGLA OFICIAL NPS (dormir en el carro, cierres, permisos, fuego) que aplica al plan del usuario, dila explícitamente aunque no la haya preguntado con esas palabras.
15. Da tarifas o costos de entrada solo si la pregunta es de tarifas, pases, costos o dinero.
16. Si preguntan por "el próximo" día, fecha o evento, compara cada fecha de la lista del CONTEXTO con HOY (o con la fecha de hoy que da el usuario) y elige la primera posterior; si el CONTEXTO trae PRÓXIMO DÍA DE ENTRADA GRATIS, usa ese.
17. HOY viene al inicio del CONTEXTO. Si el usuario planea para fechas que ya pasaron, díselo primero y luego da lo que sigue aplicando.
18. Para comparar pases, llama UNA vez a calculate_fees con todas las visitas y compare_passes: true, y repite su conclusión (CONVIENE EL PASE / CONVIENE PAGAR EN CASETA) con la diferencia.

DATOS VIVOS — REGLAS IMPORTANTES:
- Para precios de entrada, alertas y reservas de campamentos, usa ÚNICAMENTE el bloque DATOS EN VIVO o las PÁGINAS OFICIALES NPS del CONTEXTO.
- Cada vez que des una tarifa o una alerta, agrega la liga oficial de nps.gov (del bloque o de la página oficial): son datos que pueden haber cambiado. La fecha de verificación la agrega el sistema.
- Cada línea de tarifa del bloque DATOS EN VIVO es DISTINTA y NO se combina ni se sustituye una por otra. Son tarifas separadas: "Entrada por vehículo", "Entrada por persona" y "Tarifa de NO-RESIDENTE".
- Cuando te pregunten por el recargo de NO-RESIDENTE o de extranjero (p. ej. "soy mexicano, ¿pago más?"), usa EXCLUSIVAMENTE la línea etiquetada "Tarifa de NO-RESIDENTE" o lo que diga la página oficial de tarifas de no residente. NUNCA respondas ese recargo con la tarifa "por persona" ni con ninguna otra tarifa de entrada.
- El recargo de NO-RESIDENTE solo aplica a quien NO vive en EE. UU. y solo en los parques que la página oficial nombra. Si el usuario dice que vive en EE. UU., no lo sumes. Si el parque no está en esa lista, dilo.
- Cierres, condiciones y estado de caminos: úsalos solo si vienen en una PÁGINA OFICIAL NPS del CONTEXTO (cita su liga). Si el CONTEXTO los menciona como GUÍA EDITORIAL, preséntalo como "según nuestra guía (puede haber cambiado)" y remite a nps.gov.
- Si los datos vivos no existen, dilo con honestidad y dirige al usuario a nps.gov.
- Nunca inventes precios ni fechas. Honestidad sobre completitud.

NUNCA:
- Inventes requisitos de visa, permisos, precios o disponibilidades específicas.
- Recomiendes marcas o productos que no estén en el contexto.
- Digas que puedes hacer reservas o procesar pagos.
- Recomiendes senderos específicos como si fueran una recomendación del motor: el motor recomienda parques, no senderos.
- Prometas conectar al usuario con Frank o con un humano por WhatsApp desde este chat — eso ya no existe aquí; el sistema ofrece el quiz y la captura de correo por su cuenta cuando corresponde. (Lo que sí puedes decir, si viene en la TARJETA DE PRODUCTO: después de pagar el itinerario se recibe el WhatsApp.)`;

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
{"answer": "<tu respuesta en español, con las fuentes al final>", "parks_mentioned": ["<park_code de cada parque que nombras>"], "out_of_scope": true|false}
Los park_code vienen del resultado de la herramienta o de la guía abierta. Si no nombras parques, usa [].
out_of_scope: true SOLO en modo parque específico, únicamente en el caso (A) SCOPE descrito abajo. En cualquier otro caso, false.`;

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

(A) SCOPE — la pregunta es claramente de OTRO parque/destino o totalmente fuera de tema (p. ej. "¿qué tan lejos está Yosemite?", otro parque por nombre, o "¿qué otro parque me recomiendas?"). SOLO en ese caso responde exactamente (y pon "out_of_scope": true):
"Me enfoco solo en este parque. Si buscas otro destino, descubre el tuyo con nuestro quiz gratuito de Nomaderia — toma menos de un minuto."

(B) SIN DATOS — la pregunta SÍ es sobre ${parkLabel} pero ni el CONTEXTO ni los DATOS EN VIVO la cubren (p. ej. uso horario, tours, un detalle que falta). Responde ("out_of_scope": false):
"No tengo esa información específica sobre ${parkLabel}."

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

type ChatTool = typeof RECOMMEND_TOOL | typeof CALCULATE_TOOL | typeof CALCULATE_FEES_TOOL;

async function chat(messages: ChatMessage[], tools: ChatTool[], toolChoice: "auto" | "none"): Promise<ChatMessage> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model:           CHAT_MODEL,
      max_tokens:      700,
      temperature:     0, // ADR-037: determinista (mismas respuestas en el examen y en producción)
      response_format: { type: "json_object" },
      messages,
      ...(tools.length ? { tools, tool_choice: toolChoice } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`GPT error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.choices[0].message as ChatMessage;
}

/** Final model output → { answer, parks_mentioned, out_of_scope }. Tolerates a non-JSON reply. */
function parseAnswer(content: string | null): { answer: string; parksMentioned: string[]; outOfScope: boolean } {
  const raw = (content ?? "").trim();
  try {
    const parsed = JSON.parse(raw) as { answer?: unknown; parks_mentioned?: unknown; out_of_scope?: unknown };
    const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
    const parksMentioned = Array.isArray(parsed.parks_mentioned)
      ? parsed.parks_mentioned.filter((c): c is string => typeof c === "string")
      : [];
    const outOfScope = parsed.out_of_scope === true;
    return { answer, parksMentioned, outOfScope };
  } catch {
    return { answer: raw, parksMentioned: [], outOfScope: false };
  }
}

/** Deterministic note on who lives where, read from the question (no facts added). */
function residencyNote(question: string): string {
  const notes: string[] = [];
  if (NONRESIDENT_HINT.test(question) && !mentionsPass(question)) {
    notes.push("la pregunta menciona personas que NO viven en EE. UU. Si DATOS EN VIVO trae la línea «Tarifa de NO-RESIDENTE» para ese parque, o su página oficial la cobra, inclúyela para esas personas según lo que diga la línea (a quién se cobra), además de la entrada; no la omitas. Ojo: la «Entrada por vehículo» se cobra UNA sola vez por carro (no por persona); la Tarifa de NO-RESIDENTE se cobra por persona. Si entran en UN carro: entrada_vehículo + recargo × personas. Si entran a pie o se cobra por persona: (entrada_persona + recargo) × personas.");
  }
  if (mentionsPass(question)) {
    notes.push("la pregunta menciona un pase: ANTES de cobrar entrada o Tarifa de NO-RESIDENTE, lee en el CONTEXTO la página oficial de pases o de no residentes (aparece primero) y copia a quién cubre ese pase (titular, pasajeros del vehículo, adultos adicionales, y si cubre también la tarifa de no residente). No cobres nada que esa página diga que el pase cubre.");
  }
  if (US_RESIDENT_HINT.test(question)) {
    notes.push("la pregunta menciona a alguien que SÍ vive en EE. UU.: a esa persona no se le cobra la Tarifa de NO-RESIDENTE.");
  }
  return notes.length ? `\n\nNOTA DEL SISTEMA: ${notes.join(" ")}` : "";
}

/** "1. foo" list markers → "- foo": an ordinal is formatting, not a fact to ground. */
function bulletize(answer: string): string {
  return answer.replace(/^(\s*)\d{1,2}[.)]\s+(?=\S)/gm, "$1- ");
}

function jsonResponse(body: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}


function visitorSession(raw: unknown): string {
  if (typeof raw === "string" && /^[A-Za-z0-9-]{8,80}$/.test(raw.trim())) return raw.trim();
  return crypto.randomUUID();
}

function priorCount(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(20, Math.floor(raw)));
}

interface EventsWriter {
  from(table: "events"): {
    select(columns: string, options: { count: "exact"; head: true }): {
      eq(column: string, value: string): {
        eq(column: string, value: string): {
          gte(column: string, value: string): Promise<{ count: number | null; error: { message: string } | null }>;
        };
      };
    };
    insert(row: { session_id: string; type: string; payload: Record<string, unknown> }): Promise<{ error: { message: string } | null }>;
  };
}

async function countTurns(service: EventsWriter | null, sessionId: string): Promise<number | null> {
  if (!service) return null;
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await service
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("type", "concierge_turn")
    .eq("session_id", sessionId)
    .gte("created_at", since);
  if (error) {
    console.warn("concierge rate-limit count failed:", error.message);
    return null;
  }
  return count ?? 0;
}

async function logTurn(
  service: EventsWriter | null,
  sessionId: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  if (!service) return false;
  const { error } = await service.from("events").insert({
    session_id: sessionId,
    type: "concierge_turn",
    payload,
  });
  if (error) {
    console.warn("concierge event insert failed:", error.message);
    return false;
  }
  return true;
}

// ─── ADR-036: chunk dates, safety cards ───────────────────────────────────────

/** source_url / fetched_at / kind for retrieved chunks (service role: knowledge_chunks RLS is admin-only). */
async function loadChunkMeta(ids: string[]): Promise<Map<string, ChunkSourceMeta>> {
  const out = new Map<string, ChunkSourceMeta>();
  if (!SUPA_SERVICE || !ids.length) return out;
  const client = createClient(SUPA_URL, SUPA_SERVICE);
  const { data, error } = await client
    .from("knowledge_chunks")
    .select("id, source_url, fetched_at, kind, park_code")
    .in("id", ids)
    .returns<ChunkSourceMeta[]>();
  if (error) {
    console.warn("concierge chunk meta failed:", error.message);
    return out;
  }
  for (const row of data ?? []) out.set(row.id, row);
  return out;
}

/** NPS safety cards for these topics/parks: park order first, then topic order. Max `limit`, distinct topics. */
async function loadSafetyCards(topics: SafetyTopic[], parkCodes: string[], limit = 2): Promise<{ cards: SafetyCard[]; rows: SafetyCardRow[] }> {
  if (!SUPA_SERVICE || !topics.length || !parkCodes.length) return { cards: [], rows: [] };
  const client = createClient(SUPA_URL, SUPA_SERVICE);
  const { data, error } = await client
    .from("knowledge_chunks")
    .select("id, content, source_field, source_url, fetched_at, park_code, metadata")
    .eq("source_table", "nps_safety_cards")
    .eq("kind", "safety")
    .in("park_code", parkCodes)
    .in("source_field", topics.map((t) => `card:${t}`))
    .returns<SafetyCardRow[]>();
  if (error) {
    console.warn("concierge safety cards failed:", error.message);
    return { cards: [], rows: [] };
  }
  const rows = (data ?? []).slice().sort((a, b) => {
    const pa = parkCodes.indexOf(a.park_code ?? ""), pb = parkCodes.indexOf(b.park_code ?? "");
    if (pa !== pb) return pa - pb;
    return topics.indexOf(a.source_field.replace("card:", "") as SafetyTopic) -
      topics.indexOf(b.source_field.replace("card:", "") as SafetyTopic);
  });
  const picked: SafetyCardRow[] = [];
  const seenTopics = new Set<string>();
  for (const row of rows) {
    if (picked.length >= limit) break;
    if (seenTopics.has(row.source_field) || !row.metadata?.verbatim || !row.source_url) continue;
    seenTopics.add(row.source_field);
    picked.push(row);
  }
  const cards: SafetyCard[] = picked.map((row) => {
    const topic = row.source_field.replace("card:", "") as SafetyTopic;
    return {
      id: row.id,
      park_code: row.park_code ?? "",
      topic: (SAFETY_TOPICS as readonly string[]).includes(topic) ? topic : "emergency",
      es: row.metadata?.es ?? null,
      verbatim: row.metadata?.verbatim ?? "",
      source_url: row.source_url ?? "",
      fetched_at: row.fetched_at,
      park_name: NPS_PARKS[row.park_code ?? ""] ?? row.park_code ?? "",
    };
  });
  return { cards, rows: picked };
}

interface EvidenceChunk {
  id:            string;
  content:       string;
  source_table?: string;
  kind?:         string | null;
  source_url?:   string | null;
  fetched_at?:   string | null;
}

interface Evidence {
  chunks:          EvidenceChunk[];
  live_data_block: string;
  live_synced_at?: string | null;
  tool_outputs?:   string[];
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
    const body = await req.json() as {
      question:          string;
      destination_slug?: string;
      session_id?:       string;
      prior_answers?:    number;
      include_evidence?: boolean;
    };
    const includeEvidence = body.include_evidence === true;
    const { question, destination_slug } = body;
    const sessionId = visitorSession(body.session_id);
    const priorAnswers = priorCount(body.prior_answers);
    const askEmail = shouldAskEmail(priorAnswers);
    // Seguridad: detector original (fixture offline) + temas ES de ADR-036.
    // Se recalcula con los parques mencionados una vez construido el índice.
    let safetyTopics: SafetyTopic[] = detectSafetyTopics(question ?? "");
    let safety = isSafetyTopic(question ?? "") || safetyTopics.length > 0;
    const service: EventsWriter | null = SUPA_SERVICE
      ? createClient(SUPA_URL, SUPA_SERVICE) as unknown as EventsWriter
      : null;

    if (!question?.trim()) {
      return jsonResponse({ error: "Se requiere el campo 'question'" }, corsHeaders, 400);
    }

    async function deliver(opts: {
      answer: string;
      sources?: Source[];
      chunkIds?: string[];
      escalate?: boolean;
      askEmail?: boolean;
      answerCheck: string;
      unconfirmed?: boolean;
      recommendations?: ConciergeRecommendation[];
      dateLabel?: string;
      /** Verbatim NPS safety cards (or the 911 fallback), appended after the grounded answer. */
      safetyBlock?: string;
      evidence?: Evidence;
    }): Promise<Response> {
      const sources = opts.sources ?? [];
      // No date by default: the footer only shows dates of the cited sources (never today's).
      const body = opts.safetyBlock ? `${opts.answer.trim()}\n\n${opts.safetyBlock}` : opts.answer;
      const text = composeVisibleAnswer(body, safety, sources, opts.dateLabel);
      const logged = await logTurn(service, sessionId, {
        question: question.slice(0, 4000),
        answer: text.slice(0, 4000),
        chunk_ids: opts.chunkIds ?? [],
        destination_slug: destination_slug ?? null,
        answer_check: opts.answerCheck,
      });
      return jsonResponse({
        answer: text,
        sources,
        escalate: Boolean(opts.escalate),
        quiz_url: opts.escalate ? QUIZ_URL : undefined,
        ask_email: Boolean(opts.askEmail),
        unconfirmed: Boolean(opts.unconfirmed),
        chunk_ids: opts.chunkIds ?? [],
        logged,
        session_id: sessionId,
        engine_version: ENGINE_DATA.engine_version,
        recommendations: opts.recommendations,
        answer_check: opts.answerCheck,
        ...(includeEvidence
          ? { evidence: opts.evidence ?? { chunks: [], live_data_block: "" } }
          : {}),
      }, corsHeaders);
    }

    const recentTurns = await countTurns(service, sessionId);
    if (recentTurns !== null && recentTurns >= CONCIERGE_MAX_PER_HOUR) {
      return deliver({ answer: rateLimitAnswer(), answerCheck: "rate_limited", askEmail: false });
    }
    if (isClearlyOutOfScope(question)) {
      return deliver({ answer: outOfScopeAnswer(), answerCheck: "out_of_scope", askEmail });
    }
    if (isGreetingOnly(question)) {
      return deliver({ answer: greetingAnswer(), answerCheck: "greeting", askEmail: false });
    }
    if (isImmigrationQuestion(question)) {
      return deliver({ answer: immigrationAnswer(), answerCheck: "out_of_scope", askEmail: false });
    }

    // Estado que llena la búsqueda; lo usan noInfoResponse y la respuesta final.
    let retrievedChunks: KnowledgeChunk[] = [];
    let cardParkCodes: string[] = [];
    let fallbackParkCode: string | null = null;
    let liveDataForEvidence = "";
    let liveSyncedForEvidence: string | null = null;

    /** Safety cards (verbatim NPS) for the detected topics, or the 911 line + the park's safety page. */
    async function safetyAttachment(): Promise<{ text: string; chunks: EvidenceChunk[]; ids: string[] }> {
      if (!safety) return { text: "", chunks: [], ids: [] };
      const topics: SafetyTopic[] = safetyTopics.length ? safetyTopics : ["emergency"];
      const { cards, rows } = await loadSafetyCards(topics, cardParkCodes);
      if (!cards.length) return { text: safetyFallback(fallbackParkCode), chunks: [], ids: [] };
      return {
        text: formatSafetyCards(cards),
        chunks: rows.map((r) => ({
          id: r.id,
          content: r.content,
          source_table: "nps_safety_cards",
          kind: "safety",
          source_url: r.source_url,
          fetched_at: r.fetched_at,
        })),
        ids: rows.map((r) => r.id),
      };
    }

    const noInfoResponse = async () => {
      const attach = await safetyAttachment();
      return deliver({
        answer: unconfirmedAnswer(askEmail),
        answerCheck: "unconfirmed",
        askEmail,
        unconfirmed: true,
        safetyBlock: attach.text,
        chunkIds: attach.ids,
        evidence: includeEvidence
          ? {
              chunks: [
                ...retrievedChunks.map((c) => ({ id: c.id, content: c.content, source_table: c.source_table })),
                ...attach.chunks,
              ],
              live_data_block: liveDataForEvidence,
              live_synced_at: liveSyncedForEvidence,
              tool_outputs: [],
            }
          : undefined,
      });
    };

    // ── 1. Detectar si requiere handoff inmediato ─────────────────────────────
    const needsEscalation = shouldEscalate(question);
    // ADR-036: la traducción al inglés corre en paralelo con las consultas de destinos.
    const translationPromise = translateQuestionToEnglish(question);

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

    // Parques para tarjetas de seguridad: los nombrados + la guía abierta (kica → seki).
    const namedParks = findParkMentions(question, nameIndex);
    const parksForSafety = [...new Set(
      [...namedParks, ...(contextParkCode ? [contextParkCode] : [])].map((c) => LIVE_DATA_PARK_ALIAS[c] ?? c),
    )];
    safetyTopics = detectSafetyTopics(question, parksForSafety);
    safety = isSafetyTopic(question) || safetyTopics.length > 0;
    cardParkCodes = parksForSafety.filter((c) => c in NPS_PARKS);
    fallbackParkCode = parksForSafety[0] ?? null;

    // ── 4. Búsqueda por similitud en knowledge_chunks ─────────────────────────
    // FIX 2: cuando hay parque en contexto, el pre-filtro por park_code vive
    // dentro de match_knowledge_chunks (parámetro filter_park_code), así la DB
    // devuelve los mejores chunks DENTRO del parque en vez de los globales.
    // ADR-036: se embeben la pregunta (ES) y su traducción (EN) en una sola llamada.
    const questionEn = await translationPromise;
    // ADR-037: reglas (cierres, dormir en el carro, permisos) del parque nombrado o de la guía abierta.
    const ruleIntents = detectRuleIntents(question);
    const embedInputs = [question, ...(questionEn ? [questionEn] : []), ...ruleIntents.map((r) => r.queryEn)];
    const embeddings = embedInputs.length > 1 ? await embedTexts(embedInputs) : [await embedQuery(question)];
    const queryEmbedding = embeddings[0];
    const enEmbedding: number[] | undefined = questionEn ? embeddings[1] : undefined;
    const ruleEmbeddings = embeddings.slice(questionEn ? 2 : 1);
    const { data: chunkData } = await supabase.rpc("match_knowledge_chunks", {
      query_embedding:  queryEmbedding,
      match_count:      MAX_CHUNKS,
      min_similarity:   MIN_SIMILARITY,
      filter_park_code: contextParkCode, // null → búsqueda global (comportamiento previo)
    });
    // ADR-036: misma función, mismos parámetros, con el embedding en inglés.
    let chunkDataEn: KnowledgeChunk[] = [];
    if (enEmbedding) {
      const { data: enData } = await supabase.rpc("match_knowledge_chunks", {
        query_embedding:  enEmbedding,
        match_count:      MAX_CHUNKS,
        min_similarity:   MIN_SIMILARITY,
        filter_park_code: contextParkCode,
      });
      chunkDataEn = (enData ?? []) as KnowledgeChunk[];
    }
    // Las tarjetas de seguridad no compiten en la búsqueda: se adjuntan por tema y
    // parque (safetyAttachment), así nunca aparece la tarjeta de otro parque.
    const notCard = (c: KnowledgeChunk) => c.source_table !== "nps_safety_cards";
    // ADR-037: todos los candidatos (ES + EN, mismo umbral); el top-8 se arma con
    // máx. PER_SOURCE_MAX chunks por fuente, rellenando con los siguientes.
    const pool = mergeChunkResults(
      [((chunkData ?? []) as KnowledgeChunk[]).filter(notCard), chunkDataEn.filter(notCard)],
      MIN_SIMILARITY,
      Number.POSITIVE_INFINITY,
    );
    const mergedChunks = diversifyChunks(pool, MAX_CHUNKS, PER_SOURCE_MAX);

    // ADR-037: chunk de regla por intención (misma función, mismo umbral, filtrada al
    // parque, consulta fija en inglés) — solo si el texto del chunk enuncia la regla.
    // Parques: los nombrados / guía abierta, y si no hay, los de lugares nombrados
    // ("Half Dome") que aparecen en los chunks recuperados.
    const ruleParks = [...new Set([
      ...parksForSafety,
      ...namedPlaceParks(question, mergedChunks).map((c) => LIVE_DATA_PARK_ALIAS[c] ?? c),
    ])].filter((c) => c in NPS_PARKS).slice(0, RULE_PARKS_MAX);
    const ruleChunks: KnowledgeChunk[] = [];
    if (ruleIntents.length && ruleParks.length && ruleEmbeddings.length === ruleIntents.length) {
      // Una por intención (el mejor de los parques): máx. 3 chunks fijados.
      const runs = await Promise.all(ruleIntents.map(async (intent, i) => {
        const perPark = await Promise.all(ruleParks.map(async (park) => {
          const { data } = await supabase.rpc("match_knowledge_chunks", {
            query_embedding:  ruleEmbeddings[i],
            match_count:      MAX_CHUNKS,
            min_similarity:   MIN_SIMILARITY,
            filter_park_code: park,
          });
          return ((data ?? []) as KnowledgeChunk[]).filter(notCard);
        }));
        return pickRuleChunks(intent, perPark.flat(), MIN_SIMILARITY, 1);
      }));
      for (const c of runs.flat()) if (!ruleChunks.some((r) => r.id === c.id)) ruleChunks.push(c);
    }

    // Preguntas de tarifas/pases: misma función con filter_park_code "nps"; hasta
    // 3 de esas páginas generales entran al top-8 (mismo umbral 0.4).
    let reserved: KnowledgeChunk[] = [];
    const nonres = NONRESIDENT_HINT.test(question);
    if (FEE_TOPIC.test(question)) {
      const { data: npsWide } = await supabase.rpc("match_knowledge_chunks", {
        query_embedding:  enEmbedding ?? queryEmbedding,
        match_count:      MAX_CHUNKS,
        min_similarity:   MIN_SIMILARITY,
        filter_park_code: "nps",
      });
      const have = new Set(mergedChunks.map((c) => c.id));
      reserved = ((npsWide ?? []) as KnowledgeChunk[])
        .filter((c) => notCard(c) && !have.has(c.id) && c.similarity >= MIN_SIMILARITY)
        // Quien no vive en EE. UU.: primero la FAQ oficial de no residente.
        .sort((a, b) => nonres
          ? Number((b.metadata.source_url ?? "").includes("nonresident")) - Number((a.metadata.source_url ?? "").includes("nonresident")) || b.similarity - a.similarity
          : b.similarity - a.similarity)
        .slice(0, Math.max(0, NPS_WIDE_SLOTS - mergedChunks.filter((c) => c.metadata.park_code === "nps").length));
    }
    if (reserved.length || ruleChunks.length) {
      const final = diversifyChunks([...pool, ...reserved], MAX_CHUNKS, PER_SOURCE_MAX, [...ruleChunks, ...reserved])
        .sort((a, b) => b.similarity - a.similarity);
      mergedChunks.splice(0, mergedChunks.length, ...final);
    }
    // Pase + no residente: las páginas generales (a quién cubre un pase) van
    // primero en el CONTEXTO para que se lean antes que la tarifa del parque.
    if (FEE_TOPIC.test(question) && nonres && mentionsPass(question)) {
      const general = mergedChunks.filter((c) => c.metadata.park_code === "nps");
      const rest = mergedChunks.filter((c) => c.metadata.park_code !== "nps");
      mergedChunks.splice(0, mergedChunks.length, ...general, ...rest);
    }
    // En modo global, nearby_parks nombra otros parques como sugerencia — eso
    // sería recomendar sin el motor (§6.1), así que se descarta.
    const chunks: KnowledgeChunk[] = mergedChunks
      .filter((c) => parkMode || c.source_field !== "nearby_parks");
    retrievedChunks = chunks;
    const chunkMeta = await loadChunkMeta(chunks.map((c) => c.id));

    // Lugares nombrados que no son nombres de parque (p. ej. un mirador): su parque.
    const placeParks = namedPlaceParks(question, chunks);
    if (placeParks.length) {
      safetyTopics = detectSafetyTopics(question, [...parksForSafety, ...placeParks]);
      safety = isSafetyTopic(question) || safetyTopics.length > 0;
      if (!cardParkCodes.length) {
        cardParkCodes = [...new Set(placeParks.map((c) => LIVE_DATA_PARK_ALIAS[c] ?? c))].filter((c) => c in NPS_PARKS);
        fallbackParkCode = fallbackParkCode ?? placeParks[0];
      }
    }

    // Pregunta de seguridad sin parque nombrado: el parque del chunk más relevante.
    if (safety && !cardParkCodes.length) {
      const top = chunks.find((c) => c.metadata.park_code && (LIVE_DATA_PARK_ALIAS[c.metadata.park_code] ?? c.metadata.park_code) in NPS_PARKS);
      if (top?.metadata.park_code) {
        const code = LIVE_DATA_PARK_ALIAS[top.metadata.park_code] ?? top.metadata.park_code;
        cardParkCodes = [code];
        fallbackParkCode = fallbackParkCode ?? code;
      }
    }

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
      // ADR-036: una página oficial NPS de un parque también trae sus datos en vivo.
      const npsCode = chunk.metadata.park_code;
      if (NPS_SOURCE_TABLES.has(chunk.source_table) && npsCode && npsCode !== "nps" && !parkCodeMap.has(npsCode)) {
        parkCodeMap.set(npsCode, displayByCode.get(npsCode)?.title ?? NPS_PARKS[npsCode] ?? npsCode);
      }
    }
    // FIX 3: si hay guía abierta, asegura el parque en contexto aunque ningún
    // chunk lo haya aportado (p. ej. búsqueda vacía) → permite responder tarifas/
    // alertas desde datos en vivo en lugar de escalar.
    if (contextParkCode && !parkCodeMap.has(contextParkCode)) {
      parkCodeMap.set(contextParkCode, contextParkTitle ?? contextParkCode);
    }

    let liveDataBlock = "";
    let liveSyncedAt: string | null = null;
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
        if (liveRows.length === 1 && liveRows[0].synced_at) liveSyncedAt = liveRows[0].synced_at;
      }
    }
    liveDataForEvidence = liveDataBlock;
    liveSyncedForEvidence = liveSyncedAt;

    // ── 5b. ADR-037: tarifas como datos + tarjeta de producto ────────────────
    const mentionsPark = namedParks.size > 0 || placeParks.length > 0 || Boolean(contextParkCode);
    const productQ = isProductQuestion(question, { mentionsPark });
    // Pregunta solo de producto (sin parque): la tarjeta es el único contexto; los
    // chunks de guías de parques que salieron por la palabra "itinerario" no aplican.
    if (productQ && !mentionsPark) {
      chunks.splice(0, chunks.length);
      liveDataBlock = "";
      liveSyncedAt = null;
      liveDataForEvidence = "";
      liveSyncedForEvidence = null;
    }
    const feeParks = [...new Set(
      [...namedParks, ...placeParks, ...(contextParkCode ? [contextParkCode] : [])].map((c) => LIVE_DATA_PARK_ALIAS[c] ?? c),
    )].filter((c) => c in FEE_PARKS);
    let feeRows: ParkFeeRow[] = [];
    let passRows: PassRuleRow[] = [];
    let feeBlock = "";
    const wantFees = FEE_TOPIC.test(question) && (feeParks.length > 0 || (!productQ && (NONRESIDENT_HINT.test(question) || PASS_HINT.test(question))));
    if (wantFees) {
      const [{ data: feeData, error: feeErr }, { data: passData, error: passErr }] = await Promise.all([
        supabase.from("park_fees").select("*"),
        supabase.from("pass_rules").select("*"),
      ]);
      if (feeErr || passErr) console.warn("concierge fee tables failed:", feeErr?.message ?? passErr?.message);
      feeRows = ((feeData ?? []) as Array<Record<string, unknown>>).map(normalizeFeeRow);
      passRows = ((passData ?? []) as Array<Record<string, unknown>>).map(normalizePassRow);
      if (feeRows.length || passRows.length) {
        feeBlock = feeFactsBlock(feeRows.filter((r) => feeParks.includes(r.park_code)), passRows);
      }
    }
    const productBlock = productQ ? productContextBlock() : "";

    // Sin chunk por encima del umbral no hay respuesta: ni el modelo ni los
    // datos en vivo solos. La frase es fija (no se adivina). Excepción (ADR-037):
    // la tabla oficial de tarifas o la tarjeta de producto sí son contexto.
    if (!chunks.length && !feeBlock && !productBlock) {
      return noInfoResponse();
    }

    // ── 6. Construir contexto para el agente ──────────────────────────────────
    const chunkContext = chunks
      .map((c, i) => {
        const kind = chunkMeta.get(c.id)?.kind ?? c.metadata.kind;
        const label = ruleChunks.some((r) => r.id === c.id)
          ? " [REGLA OFICIAL NPS para lo que pregunta el usuario: dila]"
          : NPS_SOURCE_TABLES.has(c.source_table)
          ? kind === "live"
            ? " [PÁGINA OFICIAL NPS — condiciones/alertas: pueden cambiar; cita la liga]"
            : " [PÁGINA OFICIAL NPS]"
          : TIME_SENSITIVE_SECTIONS.has(c.source_field)
          ? " [GUÍA EDITORIAL: puede haber cambiado — confirmar en nps.gov]"
          : "";
        return `[${i + 1}] ${c.metadata.title ?? ""} — ${c.metadata.section ?? c.source_field}${label}\n${c.content}`;
      })
      .join("\n\n---\n\n");
    // ADR-037: fecha de hoy (para "ya pasó" / "el próximo") y, si preguntan por días
    // gratis, el siguiente de la lista oficial calculado por código.
    const today = todayPacific();
    const freeDayNote = /gratis|free/i.test(question)
      ? nextFreeDayNote(chunks.map((c) => c.content), statedToday(question) ?? { m: today.m, d: today.d })
      : "";
    const context = [todayLineEs(), chunkContext, feeBlock, freeDayNote, productBlock].filter(Boolean).join("\n\n---\n\n");

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
        content: `CONTEXTO:\n${context || "(sin contexto de la guía)"}\n\nPREGUNTA DEL USUARIO:\n${question}${residencyNote(question)}`,
      },
    ];

    // ── 7. Respuesta + herramienta del motor (solo en modo global) ────────────
    // En modo parque se conserva la regla de alcance: "Me enfoco solo en este parque".
    // calculate (ADR-036) va en los dos modos; recommend_parks solo en modo global.
    const feeTools: ChatTool[] = feeRows.length ? [CALCULATE_FEES_TOOL] : [];
    const tools: ChatTool[] = parkMode ? [CALCULATE_TOOL, ...feeTools] : [RECOMMEND_TOOL, CALCULATE_TOOL, ...feeTools];
    const feeSources: Array<{ url: string; fetched_at: string }> = [];
    const runFees = (rawArgs: string): string => {
      const parsed = parseFeeInput(rawArgs);
      const input = typeof parsed === "string"
        ? parsed
        : reviewFeeInput(parsed, question, { mentionsNonresident: NONRESIDENT_HINT.test(question) && !US_RESIDENT_HINT.test(question) });
      if (typeof input === "string") return `ERROR calculate_fees: ${input}. Corrige los argumentos y vuelve a llamarla.`;
      const result = computeFees(input, feeRows, passRows);
      if (result.ok) feeSources.push(...result.sources);
      return result.text;
    };
    const scoped = engineDataForParkCodes(displayByCode.keys());
    let engineRun: EngineRun | null = null;
    let toolRounds = 0;
    const toolCorpus: string[] = [];
    let reply = await chat(messages, tools, "auto");
    while (reply.tool_calls?.length && toolRounds < MAX_TOOL_ROUNDS) {
      toolRounds += 1;
      messages.push({ role: "assistant", content: reply.content ?? null, tool_calls: reply.tool_calls });
      for (const call of reply.tool_calls) {
        const out = call.function.name === "recommend_parks" && !parkMode
          ? runRecommendTool(call.function.arguments, scoped, displayByCode)
          : call.function.name === "calculate"
          ? { content: runCalculate(call.function.arguments, [context, liveDataBlock, ...toolCorpus].join("\n"), question), run: null }
          : call.function.name === "calculate_fees" && feeRows.length
          ? { content: runFees(call.function.arguments), run: null }
          : { content: `Herramienta desconocida: ${call.function.name}`, run: null };
        if (out.run) engineRun = out.run;
        toolCorpus.push(out.content);
        messages.push({ role: "tool", tool_call_id: call.id, content: out.content });
      }
      reply = await chat(messages, tools, toolRounds < MAX_TOOL_ROUNDS ? "auto" : "none");
    }

    // ── 9. Revisión: solo parques respaldados (§6.1) ──────────────────────────
    // Permitidos: los que devolvió el motor, el de la guía abierta (y su parque
    // conjunto), los que nombró el usuario, y en modo parque los de nearby_parks
    // (el prompt los limita a "cerca de aquí").
    const allowed = new Set<string>(findParkMentions(question, nameIndex));
    for (const code of placeParks) allowed.add(code);
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

    let { answer, parksMentioned, outOfScope } = parseAnswer(reply.content);
    answer = bulletize(answer);
    let unbacked = findUnbackedParks(answer, parksMentioned, allowed, nameIndex);
    let answerCheck: "ok" | "regenerated" | "fallback" | "blocked_numbers" = "ok";

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
      reply = await chat(messages, tools, "none");
      ({ answer, parksMentioned, outOfScope } = parseAnswer(reply.content));
      answer = bulletize(answer);
      unbacked = findUnbackedParks(answer, parksMentioned, allowed, nameIndex);
      answerCheck = "regenerated";

      if (unbacked.length > 0 || !answer) {
        console.warn(`concierge-agent answer check: still unbacked [${unbacked.join(", ")}] after regeneration; using fallback`);
        if (!engineRun) return noInfoResponse();
        answer = fallbackAnswerEs(engineRun.result, engineRun.profile, displayByCode, SITE_URL);
        answerCheck = "fallback";
      }
    }

    // Sources cite RAG chunks — misleading under an answer that isn't
    // actually grounded in them: the out_of_scope sentence (fixed template,
    // park mode) and the fallback answer (built straight from the engine
    // result, not from chunks). noInfoResponse() already returns sources: [].
    let numberCorpus = [context, liveDataBlock, ...toolCorpus].join("\n");
    const numberAllow = safety ? ["911"] : [];
    let badNumbers = ungroundedNumbers(answer, numberCorpus, numberAllow);
    if (badNumbers.length > 0 || !answer) {
      console.warn(`concierge-agent number check: [${badNumbers.join(", ")}]`);
      messages.push({ role: "assistant", content: reply.content ?? "" });
      messages.push({
        role: "user",
        content: badNumbers.length
          ? `CORRECCIÓN: tu respuesta usa estas cifras que NO están en el contexto ni en DATOS EN VIVO ni en el motor: ${badNumbers.join(", ")}. Si una de ellas es el resultado de una cuenta hecha solo con cifras del contexto, calcúlala ahora con la herramienta calculate en UNA expresión completa. Si no, reescribe sin ninguna cifra que no aparezca ahí. Si no puedes, responde exactamente "Eso no lo tengo confirmado." Mismo formato JSON.`
          : `CORRECCIÓN: tu respuesta quedó vacía. Si no está en el contexto, responde exactamente "Eso no lo tengo confirmado." Mismo formato JSON.`,
      });
      // ADR-036: la corrección puede usar calculate (solo esa herramienta, una ronda).
      // Sus resultados son deterministas y salen de cifras ya ancladas.
      reply = await chat(messages, badNumbers.length ? [CALCULATE_TOOL, ...feeTools] : tools, badNumbers.length ? "auto" : "none");
      if (reply.tool_calls?.length) {
        messages.push({ role: "assistant", content: reply.content ?? null, tool_calls: reply.tool_calls });
        for (const call of reply.tool_calls) {
          const content = call.function.name === "calculate"
            ? runCalculate(call.function.arguments, [context, liveDataBlock, ...toolCorpus].join("\n"), question)
            : call.function.name === "calculate_fees" && feeRows.length
            ? runFees(call.function.arguments)
            : `Herramienta no disponible en la corrección: ${call.function.name}`;
          toolCorpus.push(content);
          messages.push({ role: "tool", tool_call_id: call.id, content });
        }
        numberCorpus = [context, liveDataBlock, ...toolCorpus].join("\n");
        reply = await chat(messages, [CALCULATE_TOOL, ...feeTools], "none");
      }
      ({ answer, parksMentioned, outOfScope } = parseAnswer(reply.content));
      answer = bulletize(answer);
      badNumbers = ungroundedNumbers(answer, numberCorpus, numberAllow);
      if (badNumbers.length > 0 || !answer) {
        console.warn(`concierge-agent number check: still [${badNumbers.join(", ")}]; blocking`);
        answer = unconfirmedAnswer(askEmail);
        answerCheck = "blocked_numbers";
        outOfScope = false;
      } else if (answerCheck === "ok") {
        answerCheck = "regenerated";
      }
    }

    const showSources = !outOfScope && answerCheck !== "fallback" && answerCheck !== "blocked_numbers";
    const sources = showSources ? buildSources(chunks, slugByCode, chunkMeta) : [];
    // ADR-037: fuentes de la tabla de tarifas (si se usó) y de la tarjeta de producto.
    if (showSources) {
      const feeUsed = [
        ...feeSources,
        ...(feeBlock ? feeRows.filter((r) => feeParks.includes(r.park_code)).map((r) => ({ url: r.source_url, fetched_at: r.fetched_at })) : []),
      ];
      for (const f of feeUsed) {
        if (!f.url || sources.some((x) => x.url === f.url)) continue;
        const date = shortDateEs(f.fetched_at);
        sources.push({ title: "NPS — tarifas oficiales", slug: "nps", section: "tarifas (NPS)", url: f.url, date: date ? `consultada ${date}` : undefined });
      }
    }
    if (productQ && !sources.some((x) => x.url === PRODUCT_CARD_URL)) {
      sources.push({ title: "Nomaderia — Servicios", slug: "servicios", section: "Itinerario Completo Nomaderia", url: PRODUCT_CARD_URL, date: `consultada ${PRODUCT_CARD_DATE_ES}` });
    }
    const run = engineRun;
    const recommendations: ConciergeRecommendation[] | undefined = run && answerCheck !== "blocked_numbers"
      ? run.result.parks.map((p) => toRecommendationEs(p, run.profile, displayByCode, SITE_URL))
      : undefined;

    // Escalación al quiz (ADR-030). El correo se pide aparte, solo después de
    // 2 respuestas previas (ask_email), y se guarda como lead — no aquí.
    const escalate = needsEscalation || outOfScope;
    // Fecha: la de cada fuente citada (fetched_at) va en el footer; aquí solo la de
    // los datos en vivo si se usaron. Nunca la fecha de hoy.
    const dateLabel = liveSyncedAt && liveDataBlock ? `datos en vivo NPS: ${formatDateEs(liveSyncedAt)}` : undefined;
    const attach = await safetyAttachment();

    // ── 10. Responder ─────────────────────────────────────────────────────────
    return deliver({
      answer,
      sources,
      chunkIds: [...chunks.map((c) => c.id), ...attach.ids],
      escalate,
      askEmail,
      answerCheck,
      unconfirmed: answerCheck === "blocked_numbers" || answer.startsWith("Eso no lo tengo confirmado"),
      recommendations,
      dateLabel,
      safetyBlock: [productQ ? PRODUCT_CARD_TEXT : "", attach.text].filter(Boolean).join("\n\n"),
      evidence: includeEvidence
        ? {
            chunks: [
              ...(feeBlock ? [{ id: "park_fees", content: feeBlock, source_table: "park_fees", kind: "evergreen", source_url: feeRows.find((r) => feeParks.includes(r.park_code))?.source_url ?? null, fetched_at: feeRows.find((r) => feeParks.includes(r.park_code))?.fetched_at ?? passRows[0]?.fetched_at ?? null }] : []),
              ...(productBlock ? [{ id: "product_card", content: productBlock, source_table: "product_card", kind: "evergreen", source_url: PRODUCT_CARD_URL, fetched_at: PRODUCT_CARD_FETCHED_AT }] : []),
              ...chunks.map((c) => ({
                id: c.id,
                content: c.content,
                source_table: c.source_table,
                kind: chunkMeta.get(c.id)?.kind ?? c.metadata.kind ?? null,
                source_url: chunkMeta.get(c.id)?.source_url ?? c.metadata.source_url ?? null,
                fetched_at: chunkFetchedAt(c, chunkMeta),
              })),
              ...attach.chunks.filter((a) => !chunks.some((c) => c.id === a.id)),
            ],
            live_data_block: liveDataBlock,
            live_synced_at: liveSyncedAt,
            tool_outputs: toolCorpus,
          }
        : undefined,
    });

  } catch (err) {
    console.error("concierge-agent error:", err);
    return jsonResponse({ error: String(err) }, corsHeaders, 500);
  }
});
