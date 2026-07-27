import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { requireAdmin } from "../_shared/admin-auth.ts";
import {
  callResponses,
  OpenAIRefusalError,
  type JsonSchemaDefinition,
} from "../_shared/openai.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-5.2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExistingGearArticle {
  slug: string;
  title: string;
}

interface GearSource {
  title: string;
  url: string;
}

interface GearCandidate {
  title: string;
  category: string;
  suggested_slug: string;
  reason_trending: string;
  sources: GearSource[];
}

interface GearResponse {
  candidates: GearCandidate[];
}

function buildPrompt(existingGear: ExistingGearArticle[], focus?: string): string {
  const catalog = existingGear
    .slice(0, 40)
    .map((item) => item.slug)
    .join(", ");

  const focusBlock = focus
    ? `Enfoque solicitado por el equipo editorial: "${focus}"\nPrioriza fuertemente este ángulo/tema en los candidatos, pero sigue devolviendo temas de gear reales y variados dentro de ese enfoque — NO conviertas todo en un único tema genérico repetido.\n\n`
    : "";

  return `${focusBlock}Eres un investigador editorial de Nomaderia. Debes encontrar 6 a 8 temas de equipo outdoor en tendencia para una audiencia de hispanos residentes en EE. UU. que son principiantes.

Prioriza equipo accesible y de entrada para senderismo y camping (precio razonable, uso real para principiantes). Evita equipo para atletas avanzados, ultralight extremo o expediciones técnicas.

EXCLUYE cualquier tema de gear que Nomaderia ya cubra, por título o slug, incluso si aparece con una variante muy cercana.

Catálogo existente a excluir:
${catalog || "(sin temas existentes)"}

Devuelve únicamente JSON válido siguiendo el esquema pedido. Las razones deben estar en español. Cada candidato debe incluir fuentes web reales y actuales. Usa web_search para validar tendencia (listas recientes, reseñas, reportes de mercado o guías actualizadas).

Requisitos adicionales:
- Genera suggested_slug en kebab-case.
- category debe ser una categoría clara (ejemplo: calzado, mochilas, hidratación, camping básico, navegación, seguridad).
- No repitas temas ya existentes en el catálogo.`;
}

function buildJsonSchema(): JsonSchemaDefinition {
  return {
    type: "object",
    additionalProperties: false,
    required: ["candidates"],
    properties: {
      candidates: {
        type: "array",
        minItems: 6,
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "category", "suggested_slug", "reason_trending", "sources"],
          properties: {
            title: { type: "string" },
            category: { type: "string" },
            suggested_slug: {
              type: "string",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
            },
            reason_trending: { type: "string" },
            sources: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "url"],
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[discover-trending-gear] request received");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY no configurada");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variables de Supabase incompletas para deduplicar gear");
    }

    const authResult = await requireAdmin(req, corsHeaders);
    if (authResult.error) {
      return authResult.error;
    }

    const body = (await req.json().catch(() => ({}))) as { focus?: string };
    const focus = body.focus?.trim() || undefined;

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: existingGear, error: gearError } = await serviceClient
      .from("gear_articles")
      .select("slug, title")
      .limit(40);

    if (gearError) {
      throw new Error(`No se pudieron leer los gear articles existentes: ${gearError.message}`);
    }

    const prompt = buildPrompt((existingGear ?? []) as ExistingGearArticle[], focus);

    const response = await callResponses<GearResponse>({
      apiKey: OPENAI_API_KEY,
      model: OPENAI_MODEL,
      maxOutputTokens: 1500,
      tools: [{ type: "web_search" }],
      input: prompt,
      jsonSchema: {
        name: "gear_candidates",
        schema: buildJsonSchema(),
      },
    });

    if (!response || typeof response === "string" || !Array.isArray(response.candidates)) {
      throw new Error("La respuesta no cumple el esquema esperado");
    }

    console.log(`[discover-trending-gear] ${response.candidates.length} candidatos generados`);

    return new Response(
      JSON.stringify({ candidates: response.candidates }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    if (error instanceof OpenAIRefusalError) {
      return new Response(
        JSON.stringify({ error: "La IA no pudo generar candidatos de gear en este momento. Frank puede revisarlo manualmente." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.error("[discover-trending-gear] error:", error);
    const message = error instanceof Error ? error.message : "Error inesperado";

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
