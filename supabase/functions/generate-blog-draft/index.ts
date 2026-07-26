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
// que concierge-agent (ADR-015/016): coseno, min_similarity 0.4, sin subirlo.
const EMBED_MODEL = "text-embedding-3-small";
const RAG_MATCH_COUNT = 8;
const RAG_MIN_SIMILARITY = 0.4;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateBlogDraftRequest {
  title?: string;
  category?: string;
  suggested_slug?: string;
  destination_id?: string;
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
  title_options: string[];
  slug: string;
  category: string;
  short_description: string;
  meta_description: string;
  tags: string[];
  content_markdown: string;
  verify_flags: string[];
  sources: ResearchSource[];
}

interface RagMeta {
  used: boolean;
  chunk_count: number;
  park_code: string | null;
  destination_id: string | null;
}

interface GenerateBlogDraftResponse {
  draft: BlogDraft;
  sources: ResearchSource[];
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

/** Resuelve el parque asociado a un tema de blog por coincidencia de texto (sin
 *  campo estructurado destination_id/park_code en el flujo de blog todavía).
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
      "title_options",
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
      title_options: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: { type: "string" },
      },
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

function buildStepBSystemPrompt(fewShotBlock: string, hasRagContext: boolean): string {
  const priorityRule = hasRagContext
    ? `- Orden de prioridad para CUALQUIER afirmación factual (distancias, costos, nombres de senderos, temporadas, permisos): primero el bloque "DATOS VERIFICADOS DE NOMADERIA (RAG)", después el material de investigación (web_search) solo para información genuinamente actual/trending que el RAG no cubra. Si el RAG y la investigación se contradicen, usa el RAG.`
    : `- No hay bloque RAG para este tema (no es específico de un parque de Nomaderia o no hay contenido editorial propio indexado). Usa el material de investigación (web_search) como única fuente factual.`;

  return `${NOMADERIA_SOUL}

Eres editor jefe de Nomaderia para contenido editorial de blog. Debes priorizar MUCHO la voz de Nomaderia: claridad, honestidad radical con principiantes, cero humo y español natural para hispanos en EE. UU.

Reglas críticas de redacción y verificación:
- Todo el contenido final debe estar en español.
- Estructura content_markdown con markdown claro, incluyendo H2 y H3 útiles para escaneo rápido.
- Mantén enfoque en intención de búsqueda real de principiantes (resolver dudas concretas).
- NO inventes hechos, cifras, fechas, reglas ni costos.
${priorityRule}
- Toda afirmación factual debe estar respaldada por el bloque RAG o por fuentes en sources.
- Si ni el RAG ni la investigación respaldan un dato, NO lo inventes: márcalo inline en content_markdown como "⚠️ VERIFICAR (IA): <qué falta>" en vez de afirmarlo, y agrega también el campo o claim a verify_flags.
- meta_description debe ser SEO y tener 160 caracteres o menos.
- title_options: propone exactamente 3 títulos alternativos a "title", cada uno con ángulo de curiosidad/SEO distinto entre sí y distinto de "title". Escríbelos en español, en segunda persona directa (voz SOUL), apelando a un miedo o duda concreta de un principiante (ej. "¿Y si me pierdo? Así te preparas para tu primer sendero solo"). No repitas la misma estructura de frase en los 3.
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
    const explicitDestinationId = body.destination_id?.trim() || undefined;

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

    // ── RAG grounding (ADR-015/016 convention) ────────────────────────────────
    // Si el tema es de un parque específico, buscamos chunks verificados en
    // knowledge_chunks ANTES de llamar al LLM. Si no se resuelve parque (post
    // general), se omite por completo — no se fuerza el RAG.
    let ragChunks: KnowledgeChunkRow[] = [];
    let ragMeta: RagMeta = { used: false, chunk_count: 0, park_code: null, destination_id: null };

    const { data: destinationRows, error: destinationsError } = await serviceClient
      .from("destinations")
      .select("id, title, park_code");

    if (destinationsError) {
      console.error("[generate-blog-draft] no se pudieron leer destinations para RAG:", destinationsError.message);
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
            console.error("[generate-blog-draft] match_knowledge_chunks falló:", chunkError.message);
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
          console.error("[generate-blog-draft] RAG retrieval falló:", ragErr);
        }
      }
    }

    const ragContextBlock = buildRagContextBlock(ragChunks);

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
          content: buildStepBSystemPrompt(buildFewShotBlock(examplePost), ragContextBlock.length > 0),
        },
        {
          role: "user",
          content:
            `Estructura este material en el esquema blog_draft.\n\n` +
            `title: ${title}\ncategory: ${category || ""}\nsuggested_slug: ${suggestedSlug || ""}\n\n` +
            (ragContextBlock ? `${ragContextBlock}\n\n` : "") +
            `Material de investigación (JSON, web_search):\n${JSON.stringify(stepA)}`,
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
      rag_meta: ragMeta,
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
