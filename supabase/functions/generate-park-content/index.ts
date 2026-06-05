import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { requireAdmin } from "../_shared/admin-auth.ts";
import { NOMADERIA_SOUL } from "../_shared/nomaderia-soul.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o";

const BATCH_SIZE = 5;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------- Types ----------

interface ParkRow {
  id: string;
  title: string;
  official_name: string | null;
  nps_description: string | null;
  region: string | null;
  designation: string | null;
  entrance_fee_usd: number | null;
  entrance_fee_type: string | null;
  short_description: string | null;
  why_visit_markdown: string | null;
  difficulty_description: string | null;
  best_season: string | null;
  season_to_avoid: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

interface ParkContent {
  title: string;
  short_description: string;
  why_visit_markdown: string;
  difficulty_description: string;
  best_season: string;
  season_to_avoid: string;
  meta_title: string;
  meta_description: string;
}

// ---------- Helpers ----------

function isEmpty(val: string | null | undefined): boolean {
  return val === null || val === undefined || val.trim() === "";
}

function buildUserPrompt(park: ParkRow): string {
  const feeInfo = park.entrance_fee_usd && park.entrance_fee_usd > 0
    ? `$${park.entrance_fee_usd} USD (${park.entrance_fee_type ?? "por vehículo"})`
    : "Entrada gratuita";

  return `Genera contenido editorial en español para este parque nacional de EE. UU.
Lector objetivo: hispano residente en EE. UU., principiante en outdoor, primera vez en un parque nacional.

DATOS DEL PARQUE (fuente oficial NPS API):
- Nombre oficial: ${park.official_name ?? park.title}
- Designación: ${park.designation ?? "National Park"}
- Estado(s): ${park.region ?? "EE. UU."}
- Descripción NPS (en inglés): ${park.nps_description ?? "(no disponible)"}
- Tarifa de entrada: ${feeInfo}

Devuelve SOLO este objeto JSON — sin markdown fences, sin texto extra antes o después:
{
  "title": "nombre en español natural (ej: 'Parque Nacional de Yellowstone')",
  "short_description": "2-3 oraciones en voz Nomaderia — qué esperar, perfil ideal, tono honesto para principiantes",
  "why_visit_markdown": "1 párrafo — el gancho emocional: por qué este parque en particular vale el viaje para alguien que nunca ha salido de la ciudad",
  "difficulty_description": "evaluación honesta para principiantes: qué terreno hay, actividades accesibles sin entrenamiento especial, lo que sí se puede hacer",
  "best_season": "1-2 oraciones — mejor época con razones concretas (clima, afluencia, acceso a caminos)",
  "season_to_avoid": "1 oración — cuándo evitar y por qué (nieve, calor extremo, cierres, masificación)",
  "meta_title": "título SEO en español, máximo 60 caracteres, incluye nombre del parque",
  "meta_description": "descripción SEO en español, máximo 155 caracteres, menciona región y perfil del visitante"
}

Reglas de voz Nomaderia:
- Tutea al lector
- Sin "destino de ensueño", "paraíso natural", "joya escondida" ni relleno de folleto turístico
- Si no conoces datos específicos de permisos o tarifas, no los inventes — omítelos o di "consulta nps.gov"
- meta_title debe ser útil para búsquedas en español de hispanohablantes en EE. UU.`;
}

async function generateParkContent(park: ParkRow): Promise<ParkContent> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY no configurada");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: NOMADERIA_SOUL },
        { role: "user", content: buildUserPrompt(park) },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("OpenAI no devolvió contenido");

  return JSON.parse(raw) as ParkContent;
}

// ---------- Main handler ----------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Método no permitido" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variables de Supabase incompletas");
    }
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY no configurada — agrégala en Supabase Dashboard → Edge Functions → Secrets");
    }

    const { user, error: authError } = await requireAdmin(req, corsHeaders);
    if (authError) return authError;

    console.log(`[generate-park-content] iniciado por ${user.email}`);

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Fetch next batch of parks pending content generation
    const { data: rows, error: fetchErr } = await db
      .from("destinations")
      .select([
        "id, title, official_name, nps_description, region, designation",
        "entrance_fee_usd, entrance_fee_type",
        "short_description, why_visit_markdown, difficulty_description",
        "best_season, season_to_avoid, meta_title, meta_description",
      ].join(", "))
      .eq("experience_type", "parque-nacional")
      .eq("research_status", "pendiente")
      .limit(BATCH_SIZE);

    if (fetchErr) throw fetchErr;

    const batch = (rows ?? []) as ParkRow[];
    console.log(`[generate-park-content] parques en batch: ${batch.length}`);

    let processed = 0;
    let updated = 0;
    let failed = 0;

    for (const park of batch) {
      processed++;
      try {
        const content = await generateParkContent(park);

        // Build update payload.
        // title: overwrite only when it still matches official_name (English placeholder from ingest).
        // All other fields: overwrite only when null or empty.
        const isTitlePlaceholder =
          !isEmpty(park.official_name) && park.title === park.official_name;

        const patch: Record<string, unknown> = {
          research_status: "ai_draft",
          last_verified_at: new Date().toISOString(),
        };

        if (isTitlePlaceholder || isEmpty(park.title))     patch.title                = content.title;
        if (isEmpty(park.short_description))               patch.short_description    = content.short_description;
        if (isEmpty(park.why_visit_markdown))              patch.why_visit_markdown   = content.why_visit_markdown;
        if (isEmpty(park.difficulty_description))          patch.difficulty_description = content.difficulty_description;
        if (isEmpty(park.best_season))                     patch.best_season          = content.best_season;
        if (isEmpty(park.season_to_avoid))                 patch.season_to_avoid      = content.season_to_avoid;
        if (isEmpty(park.meta_title))                      patch.meta_title           = content.meta_title;
        if (isEmpty(park.meta_description))                patch.meta_description     = content.meta_description;

        const { error: updateErr } = await db
          .from("destinations")
          .update(patch)
          .eq("id", park.id);

        if (updateErr) {
          console.error(`[generate-park-content] error actualizando ${park.id}:`, updateErr.message);
          failed++;
          continue;
        }

        console.log(`[generate-park-content] generado: ${park.official_name ?? park.title}`);
        updated++;
      } catch (err) {
        console.error(
          `[generate-park-content] error procesando ${park.official_name ?? park.id}:`,
          err instanceof Error ? err.message : err,
        );
        failed++;
      }
    }

    const summary = { ok: true, processed, updated, failed };
    console.log("[generate-park-content] completado", summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[generate-park-content] error no controlado", err);
    const message = err instanceof Error ? err.message : "Error inesperado";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
