// supabase/functions/concierge-agent/index.ts
// Nomaderia Adventures — Concierge IA con RAG + Datos en Vivo
//
// Flujo:
//   1. Recibe pregunta del usuario
//   2. Convierte pregunta a embedding (OpenAI)
//   3. Busca chunks relevantes en knowledge_chunks (pgvector)
//   3.5 Carga datos en vivo de park_live_data para los parques encontrados
//   4. Genera respuesta con GPT-4o-mini citando el contexto + datos vivos
//   5. Si detecta que necesita acción humana → handoff a Frank por WhatsApp
//
// Input:  { question: string, destination_slug?: string }
// Output: { answer: string, sources: Source[], escalate: boolean, whatsapp_url?: string }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Config ───────────────────────────────────────────────────────────────────
const OPENAI_KEY   = Deno.env.get("OPENAI_API_KEY")!;
const SUPA_URL     = Deno.env.get("SUPABASE_URL")!;
const SUPA_ANON    = Deno.env.get("SUPABASE_ANON_KEY")!;
const WHATSAPP_NUM = "18588996802";
const SITE_URL     = "https://nomaderia.com";
const EMBED_MODEL  = "text-embedding-3-small";
const CHAT_MODEL   = "gpt-4o-mini";
const MAX_CHUNKS        = 6;   // chunks de contexto que se pasan al agente
const MAX_CHUNKS_SCOPED = 20;  // wider net when filtering by slug
const MIN_SIMILARITY    = 0.4; // umbral mínimo de relevancia

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

/** Deduplica fuentes por slug+section */
function deduplicateSources(chunks: KnowledgeChunk[]): Source[] {
  const seen = new Set<string>();
  const sources: Source[] = [];
  for (const chunk of chunks) {
    const key = `${chunk.metadata.slug}-${chunk.metadata.section}`;
    if (!seen.has(key) && chunk.metadata.slug) {
      seen.add(key);
      const isDestination = chunk.source_table === "destinations";
      sources.push({
        title:   chunk.metadata.title  ?? "Nomaderia",
        slug:    chunk.metadata.slug,
        section: chunk.metadata.section ?? chunk.source_field,
        url:     isDestination
          ? `${SITE_URL}/destinos/${chunk.metadata.slug}`
          : `${SITE_URL}/gear/${chunk.metadata.slug}`,
      });
    }
  }
  return sources;
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

    // Entrance fee — prefer per-vehicle entry
    const fees = row.entrance_fees ?? [];
    const vehicleFee = fees.find(f =>
      f.title?.toLowerCase().includes('vehicle') ||
      f.description?.toLowerCase().includes('vehicle')
    ) ?? fees[0];
    const feeAmount = vehicleFee ? parseFloat(vehicleFee.cost) : NaN;
    const feeLine = Number.isFinite(feeAmount) && feeAmount > 0
      ? `- Entrada: $${feeAmount.toFixed(0)} por vehículo (7 días)`
      : '- Entrada: dato no disponible';

    // Alerts (max 3, title only)
    const allAlerts  = row.alerts ?? [];
    const shownAlerts = allAlerts.slice(0, 3);
    const alertsLine  = shownAlerts.length > 0
      ? `- Alertas activas (${allAlerts.length}): ${shownAlerts.map(a => a.title).join(' · ')}`
      : `- Alertas activas (0): ninguna`;

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

    return [parkHeader, feeLine, alertsLine, campsLine, staleWarning]
      .filter(Boolean)
      .join('\n');
  });

  const headerDate = singlePark ? `(verificado: ${formatDateEs(liveRows[0].synced_at)}) ` : '';
  return `---\nDATOS EN VIVO ${headerDate}\n${parkBlocks.join('\n\n')}\n---`;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT_BASE = `Eres el asistente de aventuras de Nomaderia, un servicio de concierge en español para hispanos en EE.UU. que quieren hacer su primer viaje de senderismo. Frank Molina, agente TAP certificado, es quien respalda toda la información.

REGLAS ESTRICTAS:
1. Responde SIEMPRE en español, tono amigable y directo, como un amigo experto.
2. Usa ÚNICAMENTE la información del CONTEXTO proporcionado. No inventes nada.
3. Si el contexto no tiene suficiente información para responder bien, dilo honestamente: "No tengo esa información específica, pero Frank puede ayudarte."
4. Sé concreto: da datos reales del contexto (distancias, alturas, días, precios de equipo, etc.).
5. Al final de tu respuesta incluye las fuentes relevantes en formato: [Fuente: título - sección].
6. Máximo 3 párrafos. Respuestas claras y útiles, no largas.

DATOS VIVOS — REGLAS IMPORTANTES:
- Para precios de entrada, cierres y reservas de campamentos, usa ÚNICAMENTE el bloque DATOS EN VIVO (si está disponible) y cita la fecha de verificación.
- Si los datos vivos tienen más de 7 días o no existen, dilo con honestidad y dirige al usuario a nps.gov/{park_code}.
- Nunca inventes precios ni fechas. Honestidad sobre completitud.

NUNCA:
- Inventes requisitos de visa, permisos, precios o disponibilidades específicas.
- Recomiendes marcas o productos que no estén en el contexto.
- Digas que puedes hacer reservas o procesar pagos.`;

function buildSystemPrompt(destinationSlug?: string, liveDataBlock?: string): string {
  let prompt = SYSTEM_PROMPT_BASE;

  if (destinationSlug) {
    prompt += `\n\nIMPORTANTE — MODO PARQUE ESPECÍFICO:
El usuario está leyendo la guía de "${destinationSlug}". Responde ÚNICAMENTE con información de ese parque. Si el contexto no contiene la respuesta o la pregunta es sobre otro destino, dilo claramente: "Me enfoco solo en este parque. Para otras preguntas, Frank puede ayudarte."`;
  }

  if (liveDataBlock) {
    prompt += `\n\n${liveDataBlock}`;
  }

  return prompt;
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
      return new Response(
        JSON.stringify({ error: "Se requiere el campo 'question'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 1. Detectar si requiere handoff inmediato ─────────────────────────────
    const needsEscalation = shouldEscalate(question);

    // ── 2. Embedding de la pregunta ───────────────────────────────────────────
    const queryEmbedding = await embedQuery(question);

    // ── 3. Búsqueda por similitud en knowledge_chunks ─────────────────────────
    const supabase = createClient(SUPA_URL, SUPA_ANON);

    let chunks: KnowledgeChunk[] = [];

    if (destination_slug) {
      const { data: destRow } = await supabase
        .from("destinations")
        .select("park_code")
        .eq("slug", destination_slug)
        .single();

      const parkCode = destRow?.park_code;

      if (parkCode) {
        const { data: destChunks } = await supabase.rpc("match_knowledge_chunks", {
          query_embedding: queryEmbedding,
          match_count:     MAX_CHUNKS_SCOPED,
          min_similarity:  MIN_SIMILARITY,
        });
        chunks = (destChunks ?? []).filter(
          (c: KnowledgeChunk) => c.metadata?.park_code === parkCode
        ).slice(0, MAX_CHUNKS);
      } else {
        // slug not found → general search
        const { data } = await supabase.rpc("match_knowledge_chunks", {
          query_embedding: queryEmbedding,
          match_count:     MAX_CHUNKS,
          min_similarity:  MIN_SIMILARITY,
        });
        chunks = data ?? [];
      }
    } else {
      const { data } = await supabase.rpc("match_knowledge_chunks", {
        query_embedding: queryEmbedding,
        match_count:     MAX_CHUNKS,
        min_similarity:  MIN_SIMILARITY,
      });
      chunks = data ?? [];
    }

    // ── 4. Si no hay contexto relevante → escalar directamente ────────────────
    if (!chunks.length) {
      return new Response(
        JSON.stringify({
          answer:       "No tengo información específica sobre eso en mi base de conocimiento. Frank puede ayudarte con los detalles.",
          sources:      [],
          escalate:     true,
          whatsapp_url: buildWhatsAppUrl(question),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 3.5. Fetch live park data for retrieved chunks ────────────────────────
    // Extract unique park_codes from destination chunks only.
    // Volatile data (fees, alerts, campgrounds) comes exclusively from
    // park_live_data — never from knowledge_chunks (ADR-013).
    const parkCodeMap = new Map<string, string>(); // park_code → park_title
    for (const chunk of chunks) {
      if (chunk.source_table === "destinations" && chunk.metadata.park_code) {
        parkCodeMap.set(
          chunk.metadata.park_code,
          chunk.metadata.park_title ?? chunk.metadata.title ?? chunk.metadata.park_code
        );
      }
    }

    let liveDataBlock = "";
    if (parkCodeMap.size > 0) {
      const { data: liveRows, error: liveErr } = await supabase
        .from("park_live_data")
        .select("park_code, entrance_fees, alerts, campgrounds, synced_at")
        .in("park_code", [...parkCodeMap.keys()]);

      // Silently skip if table not yet deployed or query fails — live data is
      // informational and must not crash the concierge.
      if (!liveErr && liveRows?.length) {
        liveDataBlock = buildLiveDataBlock(liveRows as ParkLiveRow[], parkCodeMap);
      }
    }

    // ── 5. Construir contexto para el agente ──────────────────────────────────
    const context = chunks
      .map((c, i) =>
        `[${i + 1}] ${c.metadata.title ?? ""} — ${c.metadata.section ?? c.source_field}\n${c.content}`
      )
      .join("\n\n---\n\n");

    // ── 6. Llamar a GPT-4o-mini ───────────────────────────────────────────────
    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:       CHAT_MODEL,
        max_tokens:  600,
        temperature: 0.3, // baja temperatura → respuestas más precisas, menos creativas
        messages: [
          { role: "system",  content: buildSystemPrompt(destination_slug, liveDataBlock) },
          {
            role:    "user",
            content: `CONTEXTO:\n${context}\n\nPREGUNTA DEL USUARIO:\n${question}`,
          },
        ],
      }),
    });

    if (!chatRes.ok) {
      throw new Error(`GPT error ${chatRes.status}: ${await chatRes.text()}`);
    }

    const chatData = await chatRes.json();
    const answer   = chatData.choices[0].message.content as string;
    const sources  = deduplicateSources(chunks);

    // ── 7. Responder ──────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        answer,
        sources,
        escalate:     needsEscalation,
        whatsapp_url: needsEscalation
          ? buildWhatsAppUrl(question, `Pregunté sobre: "${question}"`)
          : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("concierge-agent error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
