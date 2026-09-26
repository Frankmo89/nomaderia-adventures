/**
 * `fetchResults` in use-quiz delegates scoring to `rankQuizDestinations`, which
 * wraps the vendored engine (`@engine/engine`). This pins the wire: same rows +
 * answers → same top park the engine returns directly.
 */
import { describe, it, expect } from "vitest";
import { recommend } from "@engine/engine";
import { engineDataForParkCodes, rankQuizDestinations, type QuizDestinationRow } from "@/lib/quiz-ranking";

describe("use-quiz ranking wire", () => {
  it("rankQuizDestinations returns the engine's own top pick and metadata", () => {
    const rows: QuizDestinationRow[] = [
      {
        id: "1",
        title: "Joshua Tree",
        slug: "joshua-tree",
        short_description: null,
        difficulty_level: "easy",
        country: "Estados Unidos",
        estimated_budget_usd: 300,
        days_needed: "2-3",
        hero_image_url: null,
        experience_type: null,
        region: "CA",
        tags: null,
        best_season: null,
        park_code: "jotr",
        latitude: 33.79,
        longitude: -115.9,
        requires_permit: false,
      },
    ];
    const answers = {
      interest: "deserts",
      fitness_level: "sedentary",
      trip_duration: "weekend",
      budget_range: "low",
      start_city: "sandiego_socal",
    };
    const outcome = rankQuizDestinations(rows, answers, 3);
    const direct = recommend(engineDataForParkCodes(["jotr"]), outcome.profile, 3);

    expect(outcome.results[0]?.destination.park_code).toBe("jotr");
    expect(outcome.results[0]?.ranked).toEqual(direct.parks[0]);
    expect(outcome.engine_version).toBe(direct.engine_version);
  });
});
