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

// RAG grounding (match_knowledge_chunks) — mismo modelo de embeddings y umbral
// que concierge-agent / generate-blog-draft (ADR-015/016): coseno, min_similarity
// 0.4, sin subirlo.
const EMBED_MODEL = "text-embedding-3-small";
const RAG_MATCH_COUNT = 8;
const RAG_MIN_SIMILARITY = 0.4;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateGearDraftRequest {
  title?: string;
  category?: string;
  suggested_slug?: string;
  destination_id?: string;
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
  title_options: string[];
  slug: string;
  category: string;
  short_description: string;
  content_markdown: string;
  products: GearProductDraft[];
  verify_flags: string[];
  sources: Array<{ title: string; url: string; used_for: string }>;
}

interface RagMeta {
  used: boolean;
  chunk_count: number;
  park_code: string | null;
  destination_id: string | null;
}

interface GenerateGearDraftResponse {
  draft: GearDraft;
  sources: Array<{ title: string; url: string; used_for: string }>;
  verify_flags: string[];
  model: string;
  rag_meta: RagMeta;
}

interface DestinationRow {
  id: string;
  title: string;
  park_code: string | null;
}

interface KnowledgeChunkRow {
  content: string;
  metadata: { title?: string; section?: string; park_code?: string } | null;
  source_field: string;
}

function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Resuelve el parque asociado a un tema de gear por coincidencia de texto (sin
 *  campo estructurado destination_id/park_code en el flujo de gear todavía).
 *  Prioriza títulos de destino más largos/específicos primero. */
function resolveParkFromTopic(
  topic: string,
  category: string | undefined,
  destinations: DestinationRow[],
): DestinationRow | null {
  const haystack = normalizeText(`${topic} ${category ?? ""}`);
  const candidates = destinations
    .filter((d) => d.park_code)
    .sort((a, b) => b.title.length - a.title.length);

  for (const dest of candidates) {
    const needle = normalizeText(dest.title);
    if (!needle) continue;
    const pattern = new RegExp(`\\b${escapeRegExp(needle)}\\b`);
    if (pattern.test(haystack)) return dest;
  }
  return null;
}

async function embedText(apiKey: string, text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI embedding error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.data[0].embedding;
}

function buildRagContextBlock(chunks: KnowledgeChunkRow[]): string {
  if (!chunks.length) return "";

  const body = chunks
    .map((c, i) => {
      const label = `${c.metadata?.title ?? ""} — Sección: ${c.metadata?.section ?? c.source_field}`;
      return `[R${i + 1}] ${label}\n${c.content}`;
    })
    .join("\n\n---\n\n");

  return `DATOS VERIFICADOS DE NOMADERIA (RAG — contenido editorial propio de Nomaderia, prioridad máxima para hechos):\n\n${body}`;
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
      "title_options",
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
      title_options: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: { type: "string" },
      },
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

function buildStepBSystemPrompt(fewShotBlock: string, hasRagContext: boolean): string {
  const priorityRule = hasRagContext
    ? `- Orden de prioridad para CUALQUIER afirmación factual relacionada con el parque (senderos, temporadas, permisos, condiciones): primero el bloque "DATOS VERIFICADOS DE NOMADERIA (RAG)", después el material de investigación (web_search) solo para información genuinamente actual/trending que el RAG no cubra. Si el RAG y la investigación se contradicen, usa el RAG. El RAG no cubre precios ni reseñas de productos — esos siempre vienen del material de investigación y siguen sujetos a verify_flags.`
    : `- No hay bloque RAG para este tema (no es específico de un parque de Nomaderia o no hay contenido editorial propio indexado). Usa el material de investigación (web_search) como única fuente factual.`;

  return `${NOMADERIA_SOUL}

Eres editor senior de Nomaderia. Tu tarea es estructurar investigación en un draft de gear listo para revisión humana.

Reglas críticas:
- Todo contenido legible para humanos en español.
- Nunca inventes productos ni reseñas.
${priorityRule}
- affiliate_url MUST ALWAYS be an empty string "" — el admin agrega manualmente el enlace de Amazon (nomaderia-20).
- price es rango aproximado o null; SIEMPRE agrega "price" a verify_flags (los precios cambian diario).
- rating puede ser null; si viene con valor, agrega "rating" a verify_flags (decisión editorial del admin).
- Si un dato no está soportado por fuentes, usa null cuando aplique y agrega el campo a verify_flags.
- title_options: propone exactamente 3 títulos alternativos a "title", cada uno con ángulo de curiosidad/SEO distinto entre sí y distinto de "title". Escríbelos en español, en segunda persona directa (voz SOUL), apelando a una duda concreta de un principiante al elegir equipo (ej. "¿Cuáles botas no te van a sacar ampollas? Guía honesta para tu primer sendero"). No repitas la misma estructura de frase en los 3.
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
    const explicitDestinationId = body.destination_id?.trim() || undefined;

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

    // ── RAG grounding (ADR-015/016 convention) ────────────────────────────────
    // Si el tema es de un parque específico, buscamos chunks verificados en
    // knowledge_chunks ANTES de llamar al LLM. Si no se resuelve parque (gear
    // genérico, no ligado a un parque), se omite por completo.
    let ragChunks: KnowledgeChunkRow[] = [];
    let ragMeta: RagMeta = { used: false, chunk_count: 0, park_code: null, destination_id: null };

    const { data: destinationRows, error: destinationsError } = await serviceClient
      .from("destinations")
      .select("id, title, park_code");

    if (destinationsError) {
      console.error("[generate-gear-draft] no se pudieron leer destinations para RAG:", destinationsError.message);
    } else {
      // Un destination_id explícito (elegido por Frank en el admin) OVERRIDE
      // total del heurístico de texto — el heurístico solo corre como
      // fallback cuando no se pasó nada. No se confía en un park_code
      // enviado directo desde el cliente (evita el gotcha de aliasing de
      // ADR-016) — se resuelve contra destinationRows, ya leído arriba.
      const resolvedDestination = explicitDestinationId
        ? ((destinationRows ?? []) as DestinationRow[]).find((d) => d.id === explicitDestinationId) ?? null
        : resolveParkFromTopic(title, category, (destinationRows ?? []) as DestinationRow[]);

      if (resolvedDestination?.park_code) {
        try {
          const queryEmbedding = await embedText(OPENAI_API_KEY, `${title} ${category ?? ""}`.trim());
          const { data: chunkData, error: chunkError } = await serviceClient.rpc("match_knowledge_chunks", {
            query_embedding: queryEmbedding,
            match_count: RAG_MATCH_COUNT,
            min_similarity: RAG_MIN_SIMILARITY,
            filter_park_code: resolvedDestination.park_code,
          });

          if (chunkError) {
            console.error("[generate-gear-draft] match_knowledge_chunks falló:", chunkError.message);
          } else {
            ragChunks = (chunkData ?? []) as KnowledgeChunkRow[];
            ragMeta = {
              used: ragChunks.length > 0,
              chunk_count: ragChunks.length,
              park_code: resolvedDestination.park_code,
              destination_id: resolvedDestination.id,
            };
          }
        } catch (ragErr) {
          // RAG es un enriquecimiento, no un requisito — un fallo aquí no debe
          // tumbar la generación del borrador (sigue con web_search + SOUL).
          console.error("[generate-gear-draft] RAG retrieval falló:", ragErr);
        }
      }
    }

    const ragContextBlock = buildRagContextBlock(ragChunks);

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
          content: buildStepBSystemPrompt(buildFewShotBlock(exampleGear), ragContextBlock.length > 0),
        },
        {
          role: "user",
          content:
            `Estructura este material en el esquema gear_draft.\n\n` +
            `title: ${title}\ncategory: ${category}\nsuggested_slug: ${suggestedSlug || ""}\n\n` +
            (ragContextBlock ? `${ragContextBlock}\n\n` : "") +
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

    // title_options es una mejora aditiva (chips de título en el editor) — si
    // el modelo no la devolvió con la forma esperada, no debe tumbar la
    // generación del draft completo. Se normaliza a [] y se loguea.
    const titleOptions = Array.isArray(stepB.title_options) ? stepB.title_options : [];
    if (!Array.isArray(stepB.title_options)) {
      console.error(
        "[generate-gear-draft] title_options ausente o con forma inválida en la respuesta del modelo — se continúa sin alternativas de título:",
        stepB.title_options,
      );
    }

    const response: GenerateGearDraftResponse = {
      draft: { ...stepB, title_options: titleOptions },
      sources: stepB.sources,
      verify_flags: stepB.verify_flags,
      model: OPENAI_MODEL,
      rag_meta: ragMeta,
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
