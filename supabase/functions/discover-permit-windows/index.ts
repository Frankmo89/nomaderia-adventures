import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { NOMADERIA_SOUL } from "../_shared/nomaderia-soul.ts";
import { requireAdmin } from "../_shared/admin-auth.ts";
import {
  callResponses,
  OpenAIRefusalError,
  type JsonSchemaDefinition,
} from "../_shared/openai.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-5.2";
const RIDB_API_KEY = Deno.env.get("RIDB_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DiscoverPermitWindowsRequest {
  park?: string;
  year?: number;
}

interface PermitSource {
  title: string;
  url: string;
  used_for: string;
}

interface PermitWindowDraft {
  park: string;
  permit_name: string;
  window_type: "lottery" | "reservation_release" | "first_come";
  opens_at: string | null;
  closes_at: string | null;
  how_to_apply_url: string | null;
  source_url: string | null;
  year: number;
  notes: string | null;
}

interface StepAResearchOutput {
  research_notes: string;
  sources: PermitSource[];
}

interface PermitWindowsDraftResponse {
  windows: PermitWindowDraft[];
  verify_flags: string[];
  sources: PermitSource[];
  model: string;
}

function buildStepAResearchPrompt(input: { park: string; year: number }, ridbBlock: string): string {
  return `Investiga los permisos oficiales y ventanas de permiso para este parque y año.

Parque: ${input.park}
Año: ${input.year}

Audiencia: principiante hispanohablante en EE. UU.

Objetivo:
- Encontrar los permisos oficiales relevantes para este parque en este año.
- Confirmar fechas exactas cuando estén publicadas en fuentes oficiales.
- Si una fecha o ventana no puede confirmarse con una fuente oficial, no la inventes: márcala como unknown.

Prioriza fuentes oficiales (.gov, recreation.gov, nps.gov y páginas oficiales del parque). Las fechas son críticas y cambian cada año.

Gather WITH SOURCE URLS para cada permiso:
- permit_name
- window_type (lottery | reservation_release | first_come)
- exact opens_at date/time
- closes_at if applicable
- official how to apply URL
- notes

${ridbBlock}

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

function buildPermitWindowsSchema(): JsonSchemaDefinition {
  return {
    type: "object",
    additionalProperties: false,
    required: ["windows", "verify_flags", "sources"],
    properties: {
      windows: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "park",
            "permit_name",
            "window_type",
            "opens_at",
            "closes_at",
            "how_to_apply_url",
            "source_url",
            "year",
            "notes",
          ],
          properties: {
            park: { type: "string" },
            permit_name: { type: "string" },
            window_type: { type: "string", enum: ["lottery", "reservation_release", "first_come"] },
            opens_at: { type: ["string", "null"] },
            closes_at: { type: ["string", "null"] },
            how_to_apply_url: { type: ["string", "null"] },
            source_url: { type: ["string", "null"] },
            year: { type: "integer" },
            notes: { type: ["string", "null"] },
          },
        },
      },
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

async function buildRidbBlock(park: string): Promise<string> {
  if (!RIDB_API_KEY) {
    return "";
  }

  try {
    const url = new URL("https://ridb.recreation.gov/api/v1/permits");
    url.searchParams.set("query", park);

    const response = await fetch(url.toString(), {
      headers: {
        apikey: RIDB_API_KEY,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return "";
    }

    const payload = await response.json().catch(() => null) as unknown;
    if (!payload || typeof payload !== "object") {
      return "";
    }

    const text = JSON.stringify(payload).slice(0, 4000);
    return `
RIDB enrichment (si ayuda a identificar nombres oficiales de permisos/IDs; no uses esto para inventar fechas):
${text}`;
  } catch {
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[discover-permit-windows] request received");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY no configurada");
    }

    const authResult = await requireAdmin(req, corsHeaders);
    if (authResult.error) {
      return authResult.error;
    }

    const body = (await req.json().catch(() => ({}))) as DiscoverPermitWindowsRequest;
    const park = body.park?.trim();
    const year = body.year;

    if (!park || typeof year !== "number") {
      return new Response(
        JSON.stringify({ error: "Debes enviar park y year" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ridbBlock = await buildRidbBlock(park);

    const stepA = await callResponses<StepAResearchOutput>({
      apiKey: OPENAI_API_KEY,
      model: OPENAI_MODEL,
      maxOutputTokens: 3000,
      tools: [{ type: "web_search" }],
      input: buildStepAResearchPrompt({ park, year }, ridbBlock),
      jsonSchema: {
        name: "permit_windows_research",
        schema: buildStepAResearchSchema(),
      },
    });

    if (typeof stepA === "string") {
      throw new Error("La respuesta de investigación no cumple el formato esperado");
    }

    const stepB = await callResponses<PermitWindowsDraftResponse>({
      apiKey: OPENAI_API_KEY,
      model: OPENAI_MODEL,
      maxOutputTokens: 4000,
      input: [
        {
          role: "system",
          content: `${NOMADERIA_SOUL}

Eres un analista de datos de Nomaderia. Tu tarea es estructurar resultados de investigación en un draft de calendario de ventanas de permiso.

Reglas críticas:
- Este flujo es factual y preciso, no literario.
- Todo texto visible en notes debe estar en español.
- NO inventes fechas, horas, permisos ni URLs.
- Si una fecha/horario no está confirmado por una fuente oficial, usa null y agrega el campo a verify_flags.
- Prioriza fuentes oficiales .gov, recreation.gov y nps.gov para fechas.
- No generes campos fuera del esquema.
- La función NO escribe en DB; solo devuelve un borrador para revisión humana.` ,
        },
        {
          role: "user",
          content:
            `Estructura este material en el esquema permit_windows_draft.\n\n` +
            `park: ${park}\nyear: ${year}\n\n` +
            `Material de investigación (JSON):\n${JSON.stringify(stepA)}`,
        },
      ],
      jsonSchema: {
        name: "permit_windows_draft",
        schema: buildPermitWindowsSchema(),
      },
    });

    if (typeof stepB === "string") {
      throw new Error("La respuesta de draft no cumple el formato esperado");
    }

    return new Response(
      JSON.stringify({
        windows: stepB.windows,
        verify_flags: stepB.verify_flags,
        sources: stepB.sources,
        model: OPENAI_MODEL,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    if (error instanceof OpenAIRefusalError) {
      return new Response(
        JSON.stringify({ error: "La IA no pudo generar el borrador de ventanas de permiso en este momento. Intenta de nuevo." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.error("[discover-permit-windows] error:", error);
    const message = error instanceof Error ? error.message : "Error inesperado";

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
