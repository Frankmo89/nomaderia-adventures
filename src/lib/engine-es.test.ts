import { describe, expect, it } from "vitest";
import * as shared from "@shared/engine-es";
import { buildSpanishReasons, engineDataForParkCodes } from "@/lib/quiz-ranking";

describe("_shared/engine-es (shared with the Edge Functions)", () => {
  it("is the single implementation behind the quiz adapter's re-exports", () => {
    expect(engineDataForParkCodes).toBe(shared.engineDataForParkCodes);
    expect(buildSpanishReasons).toBe(shared.buildSpanishReasons);
  });

  it("has a Spanish label for every biome and tag in the engine vocab", async () => {
    const { ENGINE_DATA } = await import("@engine/engine-data.generated");
    for (const b of ENGINE_DATA.vocab.biomes) expect(shared.BIOME_LABELS_ES[b], b).toBeTruthy();
    for (const t of ENGINE_DATA.vocab.tags) expect(shared.TAG_LABELS_ES[t], t).toBeTruthy();
  });
});
