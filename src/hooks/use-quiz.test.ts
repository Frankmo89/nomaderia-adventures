/**
 * Legacy heuristic scorer tests removed in T05.
 * Ranking now lives in `src/lib/ranking.ts` + bridge `src/lib/quiz-ranking.ts`
 * (see `quiz-ranking.test.ts`).
 */
import { describe, it, expect } from "vitest";
import { rankQuizDestinations, type QuizDestinationRow } from "@/lib/quiz-ranking";

describe("use-quiz ranking wire (T05)", () => {
  it("rankQuizDestinations is the scorer used by fetchResults", () => {
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
    const ranked = rankQuizDestinations(
      rows,
      {
        interest: "deserts",
        fitness_level: "sedentary",
        trip_duration: "weekend",
        budget_range: "low",
        start_city: "sandiego_socal",
      },
      3,
    );
    expect(ranked[0]?.destination.park_code).toBe("jotr");
  });
});
