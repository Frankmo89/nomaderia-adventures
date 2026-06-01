import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { NOMADERIA_SOUL } from "../_shared/nomaderia-soul.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-5.2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateDraftRequest {
  title?: string;
  country?: string;
  suggested_slug?: string;
}

interface ExampleDestination {
  short_description: string | null;
  full_guide_markdown: string | null;
  common_fears: Array<{ question?: string; answer?: string }> | null;
}

interface StepAResearchOutput {
  research_notes: string;
  sources: Array<{ title: string; url: string; used_for: string }>;
}

interface DestinationDraft {
  title: string;
  slug: string;
  country: string;
  region: string | null;
  base_city: string | null;
  access_type: string | null;
  cell_signal_status: string | null;
  short_description: string;
  difficulty_level: "easy" | "moderate" | "challenging";
  difficulty_description: string | null;
  days_needed: string | null;
  best_season: string | null;
  estimated_budget_usd: number | null;
  preparation_plan: string;
  gear_list_markdown: string;
  itinerary_markdown: string;
  full_guide_markdown: string;
  common_fears: Array<{ question: string; answer: string }>;
  experience_type: string | null;
  tags: string[];
  verify_flags: string[];
  sources: Array<{ title: string; url: string; used_for: string }>;
}

interface OpenAIResponsesPayload {
  output_text?: string;
  output?: Array<{
    type?: string;
    refusal?: string;
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
}

function hasRefusal(payload: OpenAIResponsesPayload): boolean {
  return (payload.output ?? []).some((item) => {
    if (item.type === "refusal") {
      return true;
    }

    if (typeof item.refusal === "string" && item.refusal.trim()) {
      return true;
    }

    const firstContent = item.content?.[0];
    if (firstContent?.type === "refusal") {
      return true;
    }

    return (item.content ?? []).some((content) => {
      return content.type === "refusal" || (typeof content.refusal === "string" && content.refusal.trim().length > 0);
    });
  });
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

function buildStepAResearchPrompt(input: Required<Pick<GenerateDraftRequest, "title" | "country">> & Pick<GenerateDraftRequest, "suggested_slug">): string {
  return `Research THIS destination for a Spanish-speaking BEGINNER hiker from the US.

Destino: ${input.title}
País: ${input.country}
Slug sugerido (opcional): ${input.suggested_slug || "(no provisto)"}

Gather WITH SOURCE URLS:
- best season
- days needed
- permit/reservation rules + fees (prioriza recreation.gov, nps.gov y sitios oficiales)
- closest base city/airport used to access the destination
- access/permit type (e.g., lottery, advance reservation, general entry)
- cell signal status on route/at destination (e.g., no signal, weak signal, wifi available)
- rough USD budget
- physical prep
- gear to bring
- a simple itinerary
- common beginner fears with honest answers

Regla estricta: If a fact (price, permit, season dates, budget) is not confirmed by a source, do NOT invent it — mark it unknown.

Devuelve SOLO JSON con:
- research_notes: string
- sources: array de { title, url, used_for }

Todo en español.`;
}

function buildStepAResearchSchema() {
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

function buildDestinationDraftSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "title",
      "slug",
      "country",
      "region",
      "base_city",
      "access_type",
      "cell_signal_status",
      "short_description",
      "difficulty_level",
      "difficulty_description",
      "days_needed",
      "best_season",
      "estimated_budget_usd",
      "preparation_plan",
      "gear_list_markdown",
      "itinerary_markdown",
      "full_guide_markdown",
      "common_fears",
      "experience_type",
      "tags",
      "verify_flags",
      "sources",
    ],
    properties: {
      title: { type: "string" },
      slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
      country: { type: "string" },
      region: { type: ["string", "null"] },
      base_city: { type: ["string", "null"] },
      access_type: { type: ["string", "null"] },
      cell_signal_status: { type: ["string", "null"] },
      short_description: { type: "string" },
      difficulty_level: { type: "string", enum: ["easy", "moderate", "challenging"] },
      difficulty_description: { type: ["string", "null"] },
      days_needed: { type: ["string", "null"] },
      best_season: { type: ["string", "null"] },
      estimated_budget_usd: { type: ["integer", "null"] },
      preparation_plan: { type: "string" },
      gear_list_markdown: { type: "string" },
      itinerary_markdown: { type: "string" },
      full_guide_markdown: { type: "string" },
      common_fears: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["question", "answer"],
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
          },
        },
      },
      experience_type: { type: ["string", "null"] },
      tags: {
        type: "array",
        items: { type: "string" },
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

function buildFewShotBlock(example: ExampleDestination | null): string {
  if (!example) return "";

  const fears = Array.isArray(example.common_fears)
    ? example.common_fears
        .slice(0, 3)
        .map((fear) => `- Q: ${fear.question || ""}\n  A: ${fear.answer || ""}`)
        .join("\n")
    : "";

  return `\n\nEXAMPLE OF NOMADERIA'S VOICE — match this tone and structure, write fresh original content.
short_description ejemplo:
${example.short_description || ""}

common_fears ejemplo:
${fears || "(sin ejemplo de miedos)"}`;
}

function buildStepBSystemPrompt(fewShotBlock: string): string {
  return `${NOMADERIA_SOUL}

Eres un editor senior de Nomaderia. Tu tarea es estructurar material de investigación en un draft completo para destino.

Reglas críticas:
- Todo contenido legible para humanos en español.
- NO inventes hechos. Si un dato no está respaldado por fuentes, deja el campo en null cuando aplique y agrega el nombre del campo a verify_flags.
- Mantén enfoque en principiantes hispanos residentes en EE. UU.
- Usa formato markdown claro en preparation_plan, gear_list_markdown, itinerary_markdown y full_guide_markdown.
- Debes incluir sources con {title,url,used_for} y verify_flags.
- NO generes campos fuera del esquema.
- Campos explícitamente prohibidos: hero_image_url, gallery_images, affiliate_links, has_premium_itinerary, premium_itinerary_price, is_published, featured.
${fewShotBlock}`;
}

async function callResponsesApi(body: Record<string, unknown>): Promise<OpenAIResponsesPayload> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error ${response.status}: ${await response.text()}`);
  }

  return (await response.json()) as OpenAIResponsesPayload;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[generate-destination-draft] request received");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY no configurada");
    }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variables de Supabase incompletas");
    }

    const body = (await req.json().catch(() => ({}))) as GenerateDraftRequest;
    const title = body.title?.trim();
    const country = body.country?.trim();
    const suggestedSlug = body.suggested_slug?.trim();

    if (!title || !country) {
      return new Response(
        JSON.stringify({ error: "Debes enviar title y country" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    let exampleDestination: ExampleDestination | null = null;
    const featuredQuery = await serviceClient
      .from("destinations")
      .select("short_description, full_guide_markdown, common_fears")
      .eq("is_published", true)
      .eq("featured", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!featuredQuery.error && featuredQuery.data) {
      exampleDestination = featuredQuery.data as ExampleDestination;
    } else {
      const latestPublished = await serviceClient
        .from("destinations")
        .select("short_description, full_guide_markdown, common_fears")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestPublished.error && latestPublished.data) {
        exampleDestination = latestPublished.data as ExampleDestination;
      }
    }

    const stepAInput = {
      title,
      country,
      suggested_slug: suggestedSlug,
    };

    const stepAResponse = await callResponsesApi({
      model: OPENAI_MODEL,
      max_output_tokens: 3000,
      tools: [{ type: "web_search" }],
      input: buildStepAResearchPrompt(stepAInput),
      text: {
        format: {
          type: "json_schema",
          name: "destination_research",
          strict: true,
          schema: buildStepAResearchSchema(),
        },
      },
    });

    if (hasRefusal(stepAResponse)) {
      return new Response(
        JSON.stringify({ error: "La IA rechazó la investigación del destino. Intenta con otro destino o revisa manualmente." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stepAText = getOutputText(stepAResponse);
    if (!stepAText) {
      throw new Error("OpenAI no devolvió contenido de investigación");
    }

    const research = JSON.parse(stepAText) as StepAResearchOutput;
    const stepBResearch = {
      ...research,
      sources: research.sources.slice(0, 8),
    };

    const stepBResponse = await callResponsesApi({
      model: OPENAI_MODEL,
      max_output_tokens: 4000,
      input: [
        {
          role: "system",
          content: buildStepBSystemPrompt(buildFewShotBlock(exampleDestination)),
        },
        {
          role: "user",
          content:
            `Estructura este material en el esquema destination_draft.\n\n` +
            `title: ${title}\ncountry: ${country}\nsuggested_slug: ${suggestedSlug || ""}\n\n` +
            `Material de investigación (JSON):\n${JSON.stringify(stepBResearch)}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "destination_draft",
          strict: true,
          schema: buildDestinationDraftSchema(),
        },
      },
    });

    if (hasRefusal(stepBResponse)) {
      return new Response(
        JSON.stringify({ error: "La IA no pudo estructurar el draft en este momento. Intenta de nuevo." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stepBText = getOutputText(stepBResponse);
    if (!stepBText) {
      throw new Error("OpenAI no devolvió el draft estructurado");
    }

    const draft = JSON.parse(stepBText) as DestinationDraft;

    console.log("[generate-destination-draft] draft generated", { slug: draft.slug, title: draft.title });

    return new Response(
      JSON.stringify({
        draft,
        sources: draft.sources,
        verify_flags: draft.verify_flags,
        model: OPENAI_MODEL,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[generate-destination-draft] error:", error);
    const message = error instanceof Error ? error.message : "Error inesperado";

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
