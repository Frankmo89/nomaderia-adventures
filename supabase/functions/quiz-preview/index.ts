// supabase/functions/quiz-preview/index.ts
// Nomaderia — Free AI preview for quiz results (day 1, entry cost, live alerts).
//
// Reuses the same OpenAI provider/pattern as concierge-agent:
//   OPENAI_API_KEY + gpt-4o-mini + park_live_data (NPS) + optional RAG chunks.
// Does NOT invent live alert counts — if alerts are missing, says so.
//
// Ranking facts come from the vendored engine (../_shared/engine, synced from
// Frankmo89/us-parks-recommender — see engine.lock.json). When the client sends
// its TripProfile + candidate park codes, this function re-runs the same engine
// and only cites engine facts for a park the engine actually returned (contract §6.1).
//
// Input:  { park_code, destination_slug?, destination_title?, fitness_level?, lodging?, trip_duration?,
//           profile?: TripProfile, engine_version?: string, candidate_park_codes?: string[], k?: number }
// Output: { day1_plan, entry_cost, alerts_summary, alerts_available, synced_at, park_code, park_title,
//           engine_version, engine_mismatch, engine_verified }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  InvalidProfileError,
  recommend,
  type RankedPark,
  type TripProfile,
} from "../_shared/engine/engine.ts";
import { ENGINE_DATA } from "../_shared/engine/engine-data.generated.ts";

const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SUPA_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const CHAT_MODEL = "gpt-4o-mini";
const EMBED_MODEL = "text-embedding-3-small";
const MAX_CHUNKS = 4;
const MIN_SIMILARITY = 0.35;

// Same live-data aliases as concierge-agent (kica shares seki NPS live row).
const LIVE_DATA_PARK_ALIAS: Record<string, string> = {
  kica: "seki",
  sequ: "seki",
};

interface EntranceFee {
  cost: string;
  title: string;
  description: string;
}

interface ParkAlert {
  id?: string;
  title: string;
  description?: string;
  category?: string;
  url?: string;
}

interface ParkLiveRow {
  park_code: string;
  entrance_fees: EntranceFee[] | null;
  alerts: ParkAlert[] | null;
  synced_at: string;
}

interface PreviewRequest {
  park_code: string;
  destination_slug?: string;
  destination_title?: string;
  fitness_level?: string;
  lodging?: string;
  trip_duration?: string;
  /** Engine TripProfile the client ranked with (contract §1). */
  profile?: TripProfile | null;
  /** engine_version the client's bundle carries — mismatch = deploy skew. */
  engine_version?: string | null;
  /** Park codes the client ranked over (published destinations). */
  candidate_park_codes?: string[] | null;
  k?: number;
}

const DEFAULT_K = 3;

/**
 * Re-run the engine over the client's candidates and return the chosen park's
 * engine facts, or null if the engine did not return that park (§6.1: never
 * cite ranking facts for a park the engine did not recommend).
 */
function verifyWithEngine(
  parkCode: string,
  profile: TripProfile,
  candidates: string[] | null | undefined,
  k: number,
): RankedPark | null {
  const data =
    candidates && candidates.length > 0
      ? (() => {
          const wanted = new Set(candidates.map((c) => c.toLowerCase()));
          return { ...ENGINE_DATA, catalog: ENGINE_DATA.catalog.filter((p) => wanted.has(p.park_code)) };
        })()
      : ENGINE_DATA;
  const result = recommend(data, profile, k);
  return result.parks.find((p) => p.facts.park_code === parkCode) ?? null;
}

/** Plain-language engine facts for the prompt (§6.2). English tokens are catalog codes; the model writes Spanish. */
function describeEngineFacts(park: RankedPark): string {
  const w = park.breakdown.weighted;
  const parts = [
    `terreno/actividades ${w.content.toFixed(2)}`,
    `días ${w.days.toFixed(2)}`,
    `esfuerzo ${w.difficulty.toFixed(2)}`,
    `presupuesto de viaje ${w.budget.toFixed(2)}`,
    `penalización multitudes ${w.crowd_penalty.toFixed(2)}`,
    `penalización temporada ${w.month_penalty.toFixed(2)}`,
  ];
  return [
    `- Motor de ranking v${ENGINE_DATA.engine_version}: puesto #${park.rank}, compatibilidad ${park.match_percent}% (puntaje de ajuste, no probabilidad)${park.tied_with_neighbors ? " — EMPATE TÉCNICO con otra opción; no lo vendas como claro ganador" : ""}.`,
    `- Por qué encaja (códigos del catálogo): ${park.facts.why}`,
    `- Terrenos: ${park.facts.biomes.join(", ")} · Actividades: ${park.facts.tags.join(", ")}`,
    `- Dificultad del parque: ${park.facts.difficulty} · Días sugeridos: ${park.facts.days_needed} · Multitudes: ${park.facts.crowd} · Costo de viaje: ${park.facts.budget_tier} (no es la tarifa de entrada)`,
    `- Mejores meses: ${park.facts.best_months.join(", ")} · Remoto: ${park.facts.remote ? "sí" : "no"} · Suele requerir permiso: ${park.facts.permit_likely ? "sí (dato aproximado, puede estar desactualizado)" : "no"}`,
    park.facts.drive_hours != null
      ? `- Manejo estimado: ~${park.facts.drive_hours.toFixed(1)} h por carretera (estimación, no Google Maps)`
      : "- Manejo: sin estimación (sin origen)",
    `- Contribuciones al puntaje: ${parts.join(" · ")}`,
    `- Fuente oficial: ${park.facts.nps_url}`,
  ].join("\n");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function titleHas(f: { title?: string }, s: string): boolean {
  return (f.title ?? "").toLowerCase().includes(s);
}

function formatEntryCost(fees: EntranceFee[] | null | undefined): string {
  if (!fees || fees.length === 0) {
    return "Costo de entrada: dato NPS no disponible ahora. Verifica en nps.gov.";
  }
  const vehicle =
    fees.find((f) => titleHas(f, "vehicle") && !titleHas(f, "commercial")) ?? fees[0];
  const amount = vehicle ? parseFloat(vehicle.cost) : NaN;
  if (!Number.isFinite(amount)) {
    return "Costo de entrada: dato NPS no disponible ahora. Verifica en nps.gov.";
  }
  if (amount === 0) {
    return "Entrada gratuita según datos NPS en vivo (sujeto a cambio).";
  }
  const label = vehicle.title?.trim() || "Entrada";
  return `${label}: $${amount.toFixed(0)} USD (dato NPS en vivo).`;
}

function formatAlerts(alerts: ParkAlert[] | null | undefined): {
  summary: string;
  available: boolean;
} {
  if (alerts == null) {
    return {
      available: false,
      summary:
        "No tenemos alertas NPS en vivo para este parque en este momento. Revisa nps.gov antes de ir.",
    };
  }
  if (alerts.length === 0) {
    return {
      available: true,
      summary: "Sin alertas activas reportadas por NPS en este momento.",
    };
  }
  const titles = alerts.slice(0, 3).map((a) => a.title).filter(Boolean);
  const more = alerts.length > 3 ? ` (+${alerts.length - 3} más)` : "";
  return {
    available: true,
    summary: `Alertas NPS activas (${alerts.length}): ${titles.join(" · ")}${more}`,
  };
}

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
  return data.data[0].embedding as number[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!OPENAI_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const body = (await req.json()) as PreviewRequest;
    const parkCode = (body.park_code ?? "").trim().toLowerCase();
    if (!parkCode) {
      return new Response(
        JSON.stringify({ error: "Se requiere park_code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Engine verification (only when the client ranked with a profile).
    const engineMismatch = body.engine_version != null && body.engine_version !== ENGINE_DATA.engine_version;
    if (engineMismatch) {
      console.warn(
        `quiz-preview engine_version skew: client=${body.engine_version} server=${ENGINE_DATA.engine_version}`,
      );
    }
    let enginePark: RankedPark | null = null;
    if (body.profile) {
      try {
        const k = Number.isInteger(body.k) && (body.k as number) > 0 ? (body.k as number) : DEFAULT_K;
        enginePark = verifyWithEngine(parkCode, body.profile, body.candidate_park_codes, k);
        if (!enginePark) {
          console.warn(`quiz-preview: engine did not return ${parkCode} for the given profile; omitting engine facts`);
        }
      } catch (engineErr) {
        if (engineErr instanceof InvalidProfileError) {
          return new Response(
            JSON.stringify({ error: `Perfil inválido: ${engineErr.message}`, engine_version: ENGINE_DATA.engine_version }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        throw engineErr;
      }
    }

    const supabase = createClient(SUPA_URL, SUPA_ANON);
    const liveCode = LIVE_DATA_PARK_ALIAS[parkCode] ?? parkCode;

    // Resolve destination title/slug if not provided
    let parkTitle = body.destination_title?.trim() || parkCode;
    let slug = body.destination_slug?.trim() || "";
    if (!body.destination_title || !slug) {
      const { data: dest } = await supabase
        .from("destinations")
        .select("title, slug")
        .eq("park_code", parkCode)
        .eq("is_published", true)
        .maybeSingle();
      if (dest) {
        parkTitle = dest.title ?? parkTitle;
        slug = dest.slug ?? slug;
      }
    }

    // Live NPS data — fees + alerts only (never invent)
    let entryCost = "Costo de entrada: dato NPS no disponible ahora. Verifica en nps.gov.";
    let alertsSummary =
      "No tenemos alertas NPS en vivo para este parque en este momento. Revisa nps.gov antes de ir.";
    let alertsAvailable = false;
    let syncedAt: string | null = null;

    const { data: liveRows, error: liveErr } = await supabase
      .from("park_live_data")
      .select("park_code, entrance_fees, alerts, synced_at")
      .eq("park_code", liveCode)
      .maybeSingle();

    if (!liveErr && liveRows) {
      const row = liveRows as ParkLiveRow;
      syncedAt = row.synced_at ?? null;
      entryCost = formatEntryCost(row.entrance_fees);
      const alertFmt = formatAlerts(row.alerts);
      alertsSummary = alertFmt.summary;
      alertsAvailable = alertFmt.available;
    }

    // Optional RAG context for day-1 plan (itinerary / why_visit chunks)
    let contextBlock = "";
    try {
      const queryEmbedding = await embedQuery(
        `plan del día 1 itinerario principiante ${parkTitle} senderismo`,
      );
      const { data: chunkData } = await supabase.rpc("match_knowledge_chunks", {
        query_embedding: queryEmbedding,
        match_count: MAX_CHUNKS,
        min_similarity: MIN_SIMILARITY,
        filter_park_code: parkCode,
      });
      const chunks = (chunkData ?? []) as Array<{
        content: string;
        metadata?: { section?: string; title?: string };
        source_field?: string;
      }>;
      if (chunks.length > 0) {
        contextBlock = chunks
          .map(
            (c, i) =>
              `[${i + 1}] ${c.metadata?.section ?? c.source_field ?? "sección"}\n${c.content}`,
          )
          .join("\n\n---\n\n");
      }
    } catch (ragErr) {
      console.warn("quiz-preview RAG skipped:", ragErr);
    }

    const fitness = body.fitness_level ?? "light_activity";
    const lodging = body.lodging ?? "mixed";
    const duration = body.trip_duration ?? "weekend";

    const systemPrompt = `Eres el asistente de Nomaderia. Generas un preview GRATUITO y corto del día 1 en un parque nacional para hispanos principiantes en EE. UU.

REGLAS ESTRICTAS:
1. Responde SOLO en español, tono amigable y directo.
2. Usa ÚNICAMENTE el CONTEXTO (si existe) y los DATOS EN VIVO. No inventes tarifas, alertas, cierres ni horarios.
3. El día 1 debe ser realista para principiantes (fitness: ${fitness}, lodging: ${lodging}, duración del viaje: ${duration}).
4. Máximo 120 palabras para el plan del día 1. Sin listas interminables.
5. Si el contexto es insuficiente, di qué harías de forma genérica y honesta sin inventar nombres de senderos específicos.
6. NUNCA inventes el número de alertas ni costos de entrada — esos campos los provee el sistema por separado.
7. Si hay un bloque MOTOR DE RANKING, puedes explicar en una frase por qué este parque encaja usando esas partes (terreno/actividades, días, esfuerzo, presupuesto, multitudes, temporada) en lenguaje llano — nunca cites los números crudos ni inventes motivos que no estén ahí. Si dice EMPATE TÉCNICO, no lo presentes como claro ganador. Cierres, tarifas, clima, permisos y estado de caminos cambian a diario: remite a nps.gov.`;

    const userPrompt = `Parque: ${parkTitle} (código ${parkCode}${slug ? `, /destinos/${slug}` : ""})

DATOS EN VIVO (ya formateados — no los reescribas en tu respuesta de day1):
- ${entryCost}
- ${alertsSummary}
${syncedAt ? `- Verificado: ${syncedAt}` : "- Sin timestamp de sync"}

MOTOR DE RANKING:
${enginePark ? describeEngineFacts(enginePark) : "(sin verificación del motor para este parque — no menciones ranking ni compatibilidad)"}

CONTEXTO RAG:
${contextBlock || "(sin chunks — usa solo conocimiento genérico honesto de principiante)"}

Devuelve ÚNICAMENTE un JSON con esta forma exacta:
{"day1_plan":"...texto del plan día 1..."}`;

    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        max_tokens: 400,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!chatRes.ok) {
      throw new Error(`GPT error ${chatRes.status}: ${await chatRes.text()}`);
    }

    const chatData = await chatRes.json();
    const raw = chatData.choices?.[0]?.message?.content as string;
    let day1Plan =
      "Te proponemos un día 1 suave: llegar temprano, recorrer el centro de visitantes y una caminata corta señalizada. Frank puede armarte el itinerario completo.";
    try {
      const parsed = JSON.parse(raw) as { day1_plan?: string };
      if (parsed.day1_plan?.trim()) day1Plan = parsed.day1_plan.trim();
    } catch {
      if (raw?.trim()) day1Plan = raw.trim();
    }

    return new Response(
      JSON.stringify({
        day1_plan: day1Plan,
        entry_cost: entryCost,
        alerts_summary: alertsSummary,
        alerts_available: alertsAvailable,
        synced_at: syncedAt,
        park_code: parkCode,
        park_title: parkTitle,
        engine_version: ENGINE_DATA.engine_version,
        engine_mismatch: engineMismatch,
        engine_verified: enginePark !== null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("quiz-preview error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
