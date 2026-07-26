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

interface ExistingBlogPost {
  slug: string;
  title: string;
}

interface BlogSource {
  title: string;
  url: string;
}

interface BlogCandidate {
  title: string;
  category: string;
  suggested_slug: string;
  search_intent: string;
  sources: BlogSource[];
}

interface BlogCandidatesResponse {
  candidates: BlogCandidate[];
}

function buildPrompt(existingPosts: ExistingBlogPost[], focus?: string): string {
  const catalog = existingPosts
    .slice(0, 40)
    .map((item) => `${item.slug} :: ${item.title}`)
    .join("\n");

  const focusBlock = focus
    ? `Enfoque solicitado por el equipo editorial: "${focus}"\nPrioriza fuertemente este ángulo/tema en los candidatos, pero sigue devolviendo temas long-tail reales y variados dentro de ese enfoque — NO conviertas todo en un único tema genérico repetido.\n\n`
    : "";

  return `Eres un estratega SEO editorial de Nomaderia.

${focusBlock}Objetivo: descubrir 6 a 8 temas de blog con INTENCIÓN DE BÚSQUEDA real para una audiencia de hispanos residentes en EE. UU. que son principiantes en senderismo y aventura outdoor.

Qué sí priorizar:
- Long-tail y preguntas de principiante en español: "cómo", "qué llevar", "primera vez", "permiso X explicado", "cuánto cuesta", "vale la pena".
- Temas prácticos que una web pequeña sí puede posicionar (menos competencia que noticias generales).
- Intención accionable y de problema real, no entretenimiento.
- Sesgo hacia consultas en español usadas por latinos en EE. UU. (incluye contexto de parques de EE. UU.).

Qué NO proponer:
- Noticias genéricas de outdoor.
- Temas demasiado amplios tipo "mejores parques nacionales" sin ángulo long-tail.
- Keywords imposibles para un sitio pequeño (head terms ultra-competidos sin nicho).

DEDUP obligatorio:
- Excluye cualquier tema que ya exista por slug o por título muy parecido.
- Si el ángulo ya está cubierto aunque cambie una palabra, también exclúyelo.

Catálogo existente a excluir:
${catalog || "(sin posts existentes)"}

Para cada candidato, escribe search_intent en español explicando por qué la gente busca ese tema y desde qué necesidad concreta.

Usa web_search para respaldar cada propuesta con señales de demanda o relevancia (People Also Ask, guías oficiales, foros, comunidades, FAQs, etc.).

Devuelve únicamente JSON válido según el esquema. suggested_slug debe venir en kebab-case.`;
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
          required: ["title", "category", "suggested_slug", "search_intent", "sources"],
          properties: {
            title: { type: "string" },
            category: { type: "string" },
            suggested_slug: {
              type: "string",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
            },
            search_intent: { type: "string" },
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
    console.log("[discover-trending-blog] request received");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY no configurada");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variables de Supabase incompletas para deduplicar blog_posts");
    }

    const authResult = await requireAdmin(req, corsHeaders);
    if (authResult.error) {
      return authResult.error;
    }

    const body = (await req.json().catch(() => ({}))) as { focus?: string };
    const focus = body.focus?.trim() || undefined;

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: existingPosts, error: postsError } = await serviceClient
      .from("blog_posts")
      .select("slug, title")
      .limit(40);

    if (postsError) {
      throw new Error(`No se pudieron leer los blog posts existentes: ${postsError.message}`);
    }

    const prompt = buildPrompt((existingPosts ?? []) as ExistingBlogPost[], focus);

    const response = await callResponses<BlogCandidatesResponse>({
      apiKey: OPENAI_API_KEY,
      model: OPENAI_MODEL,
      maxOutputTokens: 1500,
      tools: [{ type: "web_search" }],
      input: prompt,
      jsonSchema: {
        name: "blog_candidates",
        schema: buildJsonSchema(),
      },
    });

    if (!response || typeof response === "string" || !Array.isArray(response.candidates)) {
      throw new Error("La respuesta no cumple el esquema esperado");
    }

    console.log(`[discover-trending-blog] ${response.candidates.length} candidatos generados`);

    return new Response(
      JSON.stringify({ candidates: response.candidates }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    if (error instanceof OpenAIRefusalError) {
      return new Response(
        JSON.stringify({ error: "La IA no pudo generar candidatos de blog en este momento. Frank puede revisarlo manualmente." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.error("[discover-trending-blog] error:", error);
    const message = error instanceof Error ? error.message : "Error inesperado";

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
