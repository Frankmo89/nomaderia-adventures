import { NOMADERIA_SOUL } from "./nomaderia-soul.ts";
import type { PolicyFact } from "./nomaderia-facts.ts";

export function composeSystemPrompt(
  taskInstruction: string,
  facts?: PolicyFact[]
): string {
  const verifiedFacts = facts?.filter((f) => f.value !== "⚠️ VERIFICAR") ?? [];

  const factsBlock =
    verifiedFacts.length > 0
      ? [
          "DATOS VERIFICADOS (no inventes ningún dato fuera de esto):",
          ...verifiedFacts.map(
            (f) => `- ${f.label}: ${f.value} (verificado: ${f.lastVerified})`
          ),
        ].join("\n")
      : null;

  return [NOMADERIA_SOUL, factsBlock, taskInstruction]
    .filter(Boolean)
    .join("\n\n");
}
