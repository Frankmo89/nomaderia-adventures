/**
 * Unit tests for quiz → ranking bridge (T05).
 */
import { describe, it, expect } from "vitest";
import {
  answersToRankingProfile,
  destinationToRankingPark,
  rankQuizDestinations,
  rankingScoreToMatchPercent,
  resolveProfileMonth,
  type QuizDestinationRow,
} from "./quiz-ranking";

function makeRow(overrides: Partial<QuizDestinationRow> = {}): QuizDestinationRow {
  return {
    id: "dest-jotr",
    title: "Joshua Tree",
    slug: "joshua-tree",
    short_description: "Desierto y rocas",
    difficulty_level: "easy",
    country: "Estados Unidos",
    estimated_budget_usd: 400,
    days_needed: "2-3",
    hero_image_url: null,
    experience_type: "desert",
    region: "CA",
    tags: ["hiking"],
    best_season: null,
    park_code: "jotr",
    latitude: 33.79,
    longitude: -115.9,
    requires_permit: false,
    ...overrides,
  };
}

describe("resolveProfileMonth", () => {
  it("reads month from trip_start_date", () => {
    expect(resolveProfileMonth({ trip_start_date: "2026-10-15" })).toBe(10);
  });

  it("returns null for flexible season without dates", () => {
    expect(resolveProfileMonth({ season: "flexible" })).toBeNull();
  });
});

describe("answersToRankingProfile", () => {
  it("maps deserts interest + San Diego origin", () => {
    const profile = answersToRankingProfile({
      interest: "deserts",
      fitness_level: "light_activity",
      trip_duration: "weekend",
      budget_range: "medium",
      start_city: "sandiego_socal",
    });
    expect(profile.biomes).toContain("desert");
    expect(profile.difficulty).toBe("easy");
    expect(profile.days_needed).toBe("2-3");
    expect(profile.budget_tier).toBe("mid");
    expect(profile.origin_lat).toBeCloseTo(32.72, 1);
    expect(profile.max_drive_hours).toBe(12);
  });

  it("maps active fitness to challenging", () => {
    const profile = answersToRankingProfile({
      interest: "mountains",
      fitness_level: "active",
      trip_duration: "two_weeks",
      budget_range: "high",
    });
    expect(profile.difficulty).toBe("challenging");
    expect(profile.days_needed).toBe("7+");
  });
});

describe("destinationToRankingPark", () => {
  it("joins catalog by park_code", () => {
    const park = destinationToRankingPark(makeRow());
    expect(park).not.toBeNull();
    expect(park!.park_code).toBe("jotr");
    expect(park!.biome).toBe("desert");
    expect(park!.name).toBe("Joshua Tree");
  });

  it("returns null without catalog park_code", () => {
    expect(destinationToRankingPark(makeRow({ park_code: null }))).toBeNull();
    expect(destinationToRankingPark(makeRow({ park_code: "xxxx" }))).toBeNull();
  });
});

describe("rankQuizDestinations", () => {
  it("returns top matches for desert weekend from San Diego", () => {
    const rows = [
      makeRow(),
      makeRow({
        id: "dest-sagu",
        title: "Saguaro",
        slug: "saguaro",
        park_code: "sagu",
        latitude: 32.25,
        longitude: -110.5,
      }),
      makeRow({
        id: "dest-yose",
        title: "Yosemite",
        slug: "yosemite",
        park_code: "yose",
        latitude: 37.75,
        longitude: -119.6,
        difficulty_level: "moderate",
      }),
    ];
    const ranked = rankQuizDestinations(
      rows,
      {
        interest: "deserts",
        fitness_level: "light_activity",
        trip_duration: "weekend",
        budget_range: "low",
        start_city: "sandiego_socal",
        trip_start_date: "2026-11-10",
      },
      3,
    );
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.length).toBeLessThanOrEqual(3);
    expect(ranked[0].matchPercent).toBeGreaterThanOrEqual(40);
    expect(ranked[0].ranked.reasons.length).toBeGreaterThan(0);
  });
});

describe("rankingScoreToMatchPercent", () => {
  it("clamps to 40–100", () => {
    expect(rankingScoreToMatchPercent(0)).toBe(40);
    expect(rankingScoreToMatchPercent(1)).toBe(100);
    expect(rankingScoreToMatchPercent(0.5)).toBe(70);
  });
});
