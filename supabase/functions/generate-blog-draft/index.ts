import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { NOMADERIA_SOUL } from "../_shared/nomaderia-soul.ts";
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

interface GenerateBlogDraftRequest {
  title?: string;
  category?: string;
  suggested_slug?: string;
}

interface ExampleBlogPost {
  short_description: string | null;
  content_markdown: string | null;
}

interface ResearchSource {
  title: string;
  url: string;
  used_for: string;
}

interface StepAResearchOutput {
  research_notes: string;
  sources: ResearchSource[];
}

interface BlogDraft {
  title: string;
  slug: string;
  category: string;
  short_description: string;
  meta_description: string;
  tags: string[];
  content_markdown: string;
  verify_flags: string[];
  sources: ResearchSource[];
}

interface GenerateBlogDraftResponse {
  draft: BlogDraft;
  sources: ResearchSource[];
  verify_flags: string[];
  model: string;
}

function buildStepAResearchPrompt(input: {
  title: string;
  category?: string;
  suggested_slug?: string;
}): string {
  return `Investiga ESTE tema para un artículo editorial de Nomaderia, dirigido a hispanos residentes en EE. UU. que son principiantes en senderismo.

Tema principal: ${input.title}
Categoría sugerida: ${input.category || "(no provista)"}
Slug sugerido: ${input.suggested_slug || "(no provisto)"}

Objetivo de investigación:
- Identificar intención de búsqueda real alrededor del tema.
- Recolectar hechos verificables que el artículo podría mencionar.

Recolecta CON URL DE FUENTE cualquier:
- reglas oficiales, requisitos, permisos o políticas
- fechas, ventanas de temporada o calendarios relevantes
- cifras, costos, rangos de precio o datos estadísticos
- afirmaciones técnicas o de seguridad que deban respaldarse

Regla estricta anti-alucinación:
- Toda afirmación factual debe rastrearse a una fuente.
- Si una fecha, cifra, costo, regla o claim no puede confirmarse, NO la afirmes. Márcala como unknown en tus notas.

Prioriza fuentes oficiales y/o reputadas, y en la medida de lo posible señales de demanda de búsqueda en español.

Devuelve SOLO JSON con:
- research_notes: string
- sources: array de { title, url, used_for }

Todo en español.`;
}

function buildStepAResearchSchema(): JsonSchemaDefinition {
  return {
    type: "object",
    additionalProperties: false,
    required: ["research_notes", "sources"],
    properties: {
      research_notes: { type: "string" },
      sources: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "url", "used_for"],
          properties: {
            title: { type: "string" },
            url: { type: "string" },
            used_for: { type: "string" },
          },
        },
      },
    },
  };
}

function buildBlogDraftSchema(): JsonSchemaDefinition {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "title",
      "slug",
      "category",
      "short_description",
      "meta_description",
      "tags",
      "content_markdown",
      "verify_flags",
      "sources",
    ],
    properties: {
      title: { type: "string" },
      slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
      category: { type: "string" },
      short_description: { type: "string" },
      meta_description: { type: "string", maxLength: 160 },
      tags: {
        type: "array",
        items: { type: "string" },
      },
      content_markdown: { type: "string" },
      verify_flags: {
        type: "array",
        items: { type: "string" },
      },
      sources: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "url", "used_for"],
          properties: {
            title: { type: "string" },
            url: { type: "string" },
            used_for: { type: "string" },
          },
        },
      },
    },
  };
}

function buildFewShotBlock(example: ExampleBlogPost | null): string {
  if (!example) return "";

  return `\n\nEJEMPLO DE VOZ EDITORIAL DE NOMADERIA (úsalo solo como referencia de tono y estructura, no copies texto literal):
short_description ejemplo:
${example.short_description || ""}

content_markdown ejemplo (extracto):
${(example.content_markdown || "").slice(0, 2000)}`;
}

function buildStepBSystemPrompt(fewShotBlock: string): string {
  return `${NOMADERIA_SOUL}

Eres editor jefe de Nomaderia para contenido editorial de blog. Debes priorizar MUCHO la voz de Nomaderia: claridad, honestidad radical con principiantes, cero humo y español natural para hispanos en EE. UU.

Reglas críticas de redacción y verificación:
- Todo el contenido final debe estar en español.
- Estructura content_markdown con markdown claro, incluyendo H2 y H3 útiles para escaneo rápido.
- Mantén enfoque en intención de búsqueda real de principiantes (resolver dudas concretas).
- NO inventes hechos, cifras, fechas, reglas ni costos.
- Toda afirmación factual debe estar respaldada por fuentes en sources.
- Si un dato no está respaldado, omítelo del texto final y agrega el campo o claim a verify_flags.
- meta_description debe ser SEO y tener 160 caracteres o menos.
- No generes campos fuera del esquema.
- Campos explícitamente prohibidos en este flujo: hero_image_url, author, reading_time_min, is_published, featured.
${fewShotBlock}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[generate-blog-draft] request received");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY no configurada");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variables de Supabase incompletas");
    }

    const authResult = await requireAdmin(req, corsHeaders);
    if (authResult.error) {
      return authResult.error;
    }

    const body = (await req.json().catch(() => ({}))) as GenerateBlogDraftRequest;
    const title = body.title?.trim();
    const category = body.category?.trim();
    const suggestedSlug = body.suggested_slug?.trim();

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Debes enviar title" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let examplePost: ExampleBlogPost | null = null;
    const featuredQuery = await serviceClient
      .from("blog_posts")
      .select("short_description, content_markdown")
      .eq("is_published", true)
      .eq("featured", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!featuredQuery.error && featuredQuery.data) {
      examplePost = featuredQuery.data as ExampleBlogPost;
    } else {
      const latestPublished = await serviceClient
        .from("blog_posts")
        .select("short_description, content_markdown")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestPublished.error && latestPublished.data) {
        examplePost = latestPublished.data as ExampleBlogPost;
      }
    }

    const stepA = await callResponses<StepAResearchOutput>({
      apiKey: OPENAI_API_KEY,
      model: OPENAI_MODEL,
      maxOutputTokens: 3000,
      tools: [{ type: "web_search" }],
      input: buildStepAResearchPrompt({
        title,
        category,
        suggested_slug: suggestedSlug,
      }),
      jsonSchema: {
        name: "blog_research",
        schema: buildStepAResearchSchema(),
      },
    });

    if (typeof stepA === "string") {
      throw new Error("La respuesta de investigación no cumple el formato esperado");
    }

    const stepB = await callResponses<BlogDraft>({
      apiKey: OPENAI_API_KEY,
      model: OPENAI_MODEL,
      maxOutputTokens: 4000,
      input: [
        {
          role: "system",
          content: buildStepBSystemPrompt(buildFewShotBlock(examplePost)),
        },
        {
          role: "user",
          content:
            `Estructura este material en el esquema blog_draft.\n\n` +
            `title: ${title}\ncategory: ${category || ""}\nsuggested_slug: ${suggestedSlug || ""}\n\n` +
            `Material de investigación (JSON):\n${JSON.stringify(stepA)}`,
        },
      ],
      jsonSchema: {
        name: "blog_draft",
        schema: buildBlogDraftSchema(),
      },
    });

    if (typeof stepB === "string") {
      throw new Error("La respuesta de draft no cumple el formato esperado");
    }

    const response: GenerateBlogDraftResponse = {
      draft: stepB,
      sources: stepB.sources,
      verify_flags: stepB.verify_flags,
      model: OPENAI_MODEL,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    if (error instanceof OpenAIRefusalError) {
      return new Response(
        JSON.stringify({ error: "La IA no pudo generar el borrador de blog en este momento. Intenta de nuevo." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.error("[generate-blog-draft] error:", error);
    const message = error instanceof Error ? error.message : "Error inesperado";

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
