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

interface GenerateGearDraftRequest {
  title?: string;
  category?: string;
  suggested_slug?: string;
}

interface ExampleGearArticle {
  short_description: string | null;
  content_markdown: string | null;
}

interface StepAResearchOutput {
  research_notes: string;
  sources: Array<{ title: string; url: string; used_for: string }>;
}

interface GearProductDraft {
  name: string;
  price: string | null;
  rating: number | null;
  pros: string[];
  cons: string[];
  affiliate_url: string;
}

interface GearDraft {
  title: string;
  slug: string;
  category: string;
  short_description: string;
  content_markdown: string;
  products: GearProductDraft[];
  verify_flags: string[];
  sources: Array<{ title: string; url: string; used_for: string }>;
}

interface GenerateGearDraftResponse {
  draft: GearDraft;
  sources: Array<{ title: string; url: string; used_for: string }>;
  verify_flags: string[];
  model: string;
}

function buildStepAResearchPrompt(input: {
  title: string;
  category: string;
  suggested_slug?: string;
}): string {
  return `Investiga ESTE tema de gear para una audiencia de principiantes hispanos residentes en EE. UU.

Tema: ${input.title}
Categoría: ${input.category}
Slug sugerido (opcional): ${input.suggested_slug || "(no provisto)"}

Gather WITH SOURCE URLS:
- qué productos específicos están bien reseñados en este tema
- pros y cons reales de cada producto
- para qué tipo de usuario sirve cada opción
- rango de precio típico (NO precio exacto)

Prioriza fuentes oficiales de fabricante y reseñas reputadas/actualizadas.

Regla estricta: No inventes precios ni fabriques reseñas. Si no hay certeza, marca unknown.

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

function buildGearDraftSchema(): JsonSchemaDefinition {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "title",
      "slug",
      "category",
      "short_description",
      "content_markdown",
      "products",
      "verify_flags",
      "sources",
    ],
    properties: {
      title: { type: "string" },
      slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
      category: { type: "string" },
      short_description: { type: "string" },
      content_markdown: { type: "string" },
      products: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "price", "rating", "pros", "cons", "affiliate_url"],
          properties: {
            name: { type: "string" },
            price: { type: ["string", "null"] },
            rating: { type: ["number", "null"] },
            pros: {
              type: "array",
              items: { type: "string" },
            },
            cons: {
              type: "array",
              items: { type: "string" },
            },
            affiliate_url: { type: "string" },
          },
        },
      },
      verify_flags: {
        type: "array",
        items: { type: "string" },
      },
      sources: {
        type: "array",
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

function buildFewShotBlock(example: ExampleGearArticle | null): string {
  if (!example) return "";

  return `\n\nEXAMPLE OF NOMADERIA'S VOICE — match this tone and structure, write fresh original content.
short_description ejemplo:
${example.short_description || ""}

content_markdown ejemplo (extracto):
${(example.content_markdown || "").slice(0, 1600)}`;
}

function buildStepBSystemPrompt(fewShotBlock: string): string {
  return `${NOMADERIA_SOUL}

Eres editor senior de Nomaderia. Tu tarea es estructurar investigación en un draft de gear listo para revisión humana.

Reglas críticas:
- Todo contenido legible para humanos en español.
- Nunca inventes productos ni reseñas.
- affiliate_url MUST ALWAYS be an empty string "" — el admin agrega manualmente el enlace de Amazon (nomaderia-20).
- price es rango aproximado o null; SIEMPRE agrega "price" a verify_flags (los precios cambian diario).
- rating puede ser null; si viene con valor, agrega "rating" a verify_flags (decisión editorial del admin).
- Si un dato no está soportado por fuentes, usa null cuando aplique y agrega el campo a verify_flags.
- No generes campos fuera del esquema.
- Campos explícitamente prohibidos: hero_image_url, is_published, featured.
${fewShotBlock}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[generate-gear-draft] request received");

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

    const body = (await req.json().catch(() => ({}))) as GenerateGearDraftRequest;
    const title = body.title?.trim();
    const category = body.category?.trim();
    const suggestedSlug = body.suggested_slug?.trim();

    if (!title || !category) {
      return new Response(
        JSON.stringify({ error: "Debes enviar title y category" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let exampleGear: ExampleGearArticle | null = null;
    const featuredQuery = await serviceClient
      .from("gear_articles")
      .select("short_description, content_markdown")
      .eq("is_published", true)
      .eq("featured", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!featuredQuery.error && featuredQuery.data) {
      exampleGear = featuredQuery.data as ExampleGearArticle;
    } else {
      const latestPublished = await serviceClient
        .from("gear_articles")
        .select("short_description, content_markdown")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestPublished.error && latestPublished.data) {
        exampleGear = latestPublished.data as ExampleGearArticle;
      }
    }

    const stepA = await callResponses<StepAResearchOutput>({
      apiKey: OPENAI_API_KEY,
      model: OPENAI_MODEL,
      maxOutputTokens: 3000,
      tools: [{ type: "web_search" }],
      input: buildStepAResearchPrompt({ title, category, suggested_slug: suggestedSlug }),
      jsonSchema: {
        name: "gear_research",
        schema: buildStepAResearchSchema(),
      },
    });

    if (typeof stepA === "string") {
      throw new Error("La respuesta de investigación no cumple el formato esperado");
    }

    const stepB = await callResponses<GearDraft>({
      apiKey: OPENAI_API_KEY,
      model: OPENAI_MODEL,
      maxOutputTokens: 4000,
      input: [
        {
          role: "system",
          content: buildStepBSystemPrompt(buildFewShotBlock(exampleGear)),
        },
        {
          role: "user",
          content:
            `Estructura este material en el esquema gear_draft.\n\n` +
            `title: ${title}\ncategory: ${category}\nsuggested_slug: ${suggestedSlug || ""}\n\n` +
            `Material de investigación (JSON):\n${JSON.stringify(stepA)}`,
        },
      ],
      jsonSchema: {
        name: "gear_draft",
        schema: buildGearDraftSchema(),
      },
    });

    if (typeof stepB === "string") {
      throw new Error("La respuesta de draft no cumple el formato esperado");
    }

    const response: GenerateGearDraftResponse = {
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
        JSON.stringify({ error: "La IA no pudo generar el borrador de gear en este momento. Intenta de nuevo." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.error("[generate-gear-draft] error:", error);
    const message = error instanceof Error ? error.message : "Error inesperado";

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
