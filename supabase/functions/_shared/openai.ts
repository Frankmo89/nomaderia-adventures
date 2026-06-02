export interface JsonSchemaDefinition {
  type: string;
  additionalProperties?: boolean;
  required?: string[];
  properties?: Record<string, unknown>;
  items?: unknown;
  minItems?: number;
  maxItems?: number;
}

export interface ResponsesJsonSchemaFormat {
  name: string;
  schema: JsonSchemaDefinition;
}

export interface ResponsesTool {
  type: string;
}

export interface CallResponsesOptions {
  apiKey: string;
  model: string;
  input: string | Array<{ role: string; content: string }>;
  tools?: ResponsesTool[];
  jsonSchema?: ResponsesJsonSchemaFormat;
  maxOutputTokens: number;
}

interface OpenAIResponsesPayload {
  output_text?: string;
  output?: Array<{
    type?: string;
    refusal?: string | null;
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string | null;
    }>;
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
  return (payload.output ?? []).some((item) => {
    if (item.type === "refusal") {
      return true;
    }

    if (item.refusal != null && `${item.refusal}`.trim().length > 0) {
      return true;
    }

    const firstContent = item.content?.[0];
    if (firstContent?.type === "refusal") {
      return true;
    }

    return (item.content ?? []).some((content) => {
      return content.type === "refusal" || (content.refusal != null && `${content.refusal}`.trim().length > 0);
    });
  });
}

export class OpenAIRefusalError extends Error {
  readonly status = 422;

  constructor(message = "La IA rechazó la solicitud.") {
    super(message);
    this.name = "OpenAIRefusalError";
  }
}

export async function callResponses<T = unknown>(
  opts: CallResponsesOptions,
): Promise<T | string> {
  const requestBody: Record<string, unknown> = {
    model: opts.model,
    input: opts.input,
    max_output_tokens: opts.maxOutputTokens,
  };

  if (opts.tools?.length) {
    requestBody.tools = opts.tools;
  }

  if (opts.jsonSchema) {
    requestBody.text = {
      format: {
        type: "json_schema",
        name: opts.jsonSchema.name,
        strict: true,
        schema: opts.jsonSchema.schema,
      },
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error ${response.status}: ${await response.text()}`);
  }

  const payload = (await response.json()) as OpenAIResponsesPayload;

  if (hasRefusal(payload)) {
    throw new OpenAIRefusalError();
  }

  const outputText = getOutputText(payload);
  if (!outputText) {
    throw new Error("OpenAI no devolvió texto utilizable");
  }

  if (opts.jsonSchema) {
    return JSON.parse(outputText) as T;
  }

  return outputText;
}
