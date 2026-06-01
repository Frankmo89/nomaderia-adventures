// supabase/functions/discover-trending-destinations/index.ts
// Busca destinos/hikes en tendencia para Nomaderia usando OpenAI Responses + web_search.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-5.2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExistingDestination {
  slug: string;
  title: string;
}

interface TrendSource {
  title: string;
  url: string;
}

interface TrendCandidate {
  title: string;
  country: string;
  suggested_slug: string;
  reason_trending: string;
  difficulty_level: "easy" | "moderate" | "challenging";
  sources: TrendSource[];
}

interface TrendResponse {
  candidates: TrendCandidate[];
}

interface OpenAIResponsesPayload {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
    refusal?: string;
  }>;
}

function getOutputText(payload: OpenAIResponsesPayload): string | null {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string" && content.text.trim()) {
        return content.text;
      }
    }
  }

  return null;
}

function hasRefusal(payload: OpenAIResponsesPayload): boolean {
  if (typeof payload.output_text === "string" && payload.output_text.trim().toLowerCase().includes("refus")) {
    return true;
  }

  return (payload.output ?? []).some((item) => {
    if (typeof item.refusal === "string" && item.refusal.trim()) {
      return true;
    }

    return (item.content ?? []).some((content) =>
      content.type === "refusal" || (typeof content.refusal === "string" && content.refusal.trim())
    );
  });
}

function escapeJsonString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
}

function buildPrompt(existingDestinations: ExistingDestination[]): string {
  const catalog = existingDestinations
    .map((destination) => `- ${destination.title} (${destination.slug})`)
    .join("\n");

  return `Eres un investigador editorial de Nomaderia. Debes encontrar 6 a 8 destinos de senderismo/outdoor que estén actualmente en tendencia para una audiencia de hispanos residentes en EE. UU. que son principiantes.

Prioriza parques nacionales de EE. UU., trails accesibles, experiencias bucket-list conocidas y opciones realistas para principiantes. Evita propuestas demasiado técnicas o remotas.

EXCLUYE cualquier destino que coincida con el catálogo existente de Nomaderia por título o slug, incluso si aparece con una variante muy cercana.

Catálogo existente a excluir:
${catalog || "(sin destinos existentes)"}

Devuelve únicamente JSON válido siguiendo el esquema pedido. Las razones deben estar en español. Cada candidato debe incluir fuentes web reales y actuales. Usa web_search para verificar tendencia, popularidad, noticias, listas recientes, guías oficiales o artículos de viaje actuales.

Requisitos adicionales:
- Genera suggested_slug en kebab-case.
- Usa difficulty_level solo como easy, moderate o challenging.
- No repitas un destino que ya exista en el catálogo.
- Si un lugar existe con el mismo nombre o un nombre prácticamente igual, exclúyelo.`;
}

function buildJsonSchema() {
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
          required: [
            "title",
            "country",
            "suggested_slug",
            "reason_trending",
            "difficulty_level",
            "sources",
          ],
          properties: {
            title: { type: "string" },
            country: { type: "string" },
            suggested_slug: {
              type: "string",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
            },
            reason_trending: { type: "string" },
            difficulty_level: {
              type: "string",
              enum: ["easy", "moderate", "challenging"],
            },
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
    console.log("[discover-trending-destinations] request received");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY no configurada");
    }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variables de Supabase incompletas para validar acceso y deduplicar destinos");
    }

    const authorization = req.headers.get("Authorization") ?? "";
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: roleData, error: roleError } = await authClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });

    if (roleError) {
      throw new Error(`Error validando rol admin: ${roleError.message}`);
    }

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "No tienes permisos para ejecutar esta acción" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: existingDestinations, error: destinationsError } = await serviceClient
      .from("destinations")
      .select("slug, title");

    if (destinationsError) {
      throw new Error(`No se pudieron leer los destinos existentes: ${destinationsError.message}`);
    }

    const prompt = buildPrompt((existingDestinations ?? []) as ExistingDestination[]);

    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        tools: [{ type: "web_search" }],
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "trending_candidates",
            strict: true,
            schema: buildJsonSchema(),
          },
        },
      }),
    });

    if (!openAiResponse.ok) {
      throw new Error(`OpenAI error ${openAiResponse.status}: ${await openAiResponse.text()}`);
    }

    const payload = (await openAiResponse.json()) as OpenAIResponsesPayload;

    if (hasRefusal(payload)) {
      return new Response(
        JSON.stringify({
          error: "La IA no pudo generar candidatos en este momento. Frank puede revisarlo manualmente.",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const outputText = getOutputText(payload);
    if (!outputText) {
      throw new Error("OpenAI no devolvió texto utilizable");
    }

    const parsed = JSON.parse(outputText) as TrendResponse;
    if (!parsed || !Array.isArray(parsed.candidates)) {
      throw new Error("La respuesta no cumple el esquema esperado");
    }

    console.log(`[discover-trending-destinations] ${parsed.candidates.length} candidatos generados`);

    return new Response(
      JSON.stringify({ candidates: parsed.candidates }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[discover-trending-destinations] error:", error);
    const message = error instanceof Error ? error.message : "Error inesperado";
    const status = message.includes("OPENAI_API_KEY") ? 500 : 500;

    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
