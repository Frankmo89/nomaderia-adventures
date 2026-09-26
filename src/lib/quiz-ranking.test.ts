/**
 * Adapter tests: quiz answers → engine TripProfile → Spanish UI shape.
 * Scoring itself is covered by src/lib/engine/engine-parity.test.ts.
 */
import { describe, expect, it } from "vitest";
import { recommend } from "@engine/engine";
import { ENGINE_DATA } from "@engine/engine-data.generated";
import {
  InvalidProfileError,
  SUPPORTED_ENGINE_VERSION,
  answersToRankingProfile,
  buildSpanishReasons,
  engineDataForParkCodes,
  rankQuizDestinations,
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

const desertWeekendFromSD = {
  interest: "deserts",
  fitness_level: "light_activity",
  trip_duration: "weekend",
  budget_range: "low",
  start_city: "sandiego_socal",
  trip_start_date: "2026-11-10",
};

describe("engine version guard", () => {
  it("vendored engine_data matches the version this adapter was reviewed against", () => {
    // If this fails after `npm run sync:engine`, re-read upstream CHANGELOG +
    // docs/engine-contract.md, re-check the maps in quiz-ranking.ts, then bump
    // SUPPORTED_ENGINE_VERSION in the same PR.
    expect(ENGINE_DATA.engine_version).toBe(SUPPORTED_ENGINE_VERSION);
  });

  it("the profile maps only emit contract enums (never InvalidProfileError)", () => {
    const answerSets: Record<string, string>[] = [
      {},
      desertWeekendFromSD,
      { interest: "mountains", fitness_level: "active", trip_duration: "two_weeks", budget_range: "unlimited" },
      { interest: "cultural", fitness_level: "sedentary", trip_duration: "one_week", budget: "medium", group_kids: "true" },
      { interest: "nope", fitness_level: "nope", trip_duration: "nope", budget_range: "nope", start_city: "otro" },
    ];
    for (const answers of answerSets) {
      expect(() => recommend(ENGINE_DATA, answersToRankingProfile(answers), 3)).not.toThrow(InvalidProfileError);
    }
  });
});

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
    const profile = answersToRankingProfile(desertWeekendFromSD);
    expect(profile.biomes).toContain("desert");
    expect(profile.difficulty).toBe("easy");
    expect(profile.days_needed).toBe("2-3");
    expect(profile.budget_tier).toBe("low");
    expect(profile.month).toBe(11);
    expect(profile.origin_lat).toBeCloseTo(32.72, 1);
    expect(profile.max_drive_hours).toBe(12);
    expect(profile.allow_remote).toBe(false);
  });

  it("maps active fitness to challenging and leaves origin null for 'otro'", () => {
    const profile = answersToRankingProfile({
      interest: "mountains",
      fitness_level: "active",
      trip_duration: "two_weeks",
      budget_range: "high",
      start_city: "otro",
    });
    expect(profile.difficulty).toBe("challenging");
    expect(profile.days_needed).toBe("7+");
    expect(profile.origin_lat).toBeNull();
    expect(profile.max_drive_hours).toBeNull();
    expect(profile.allow_remote).toBe(true);
  });

  it("adds family + easy_walk tags when kids or older adults travel", () => {
    const profile = answersToRankingProfile({ interest: "mountains", group_kids: "true" });
    expect(profile.tags).toContain("family");
    expect(profile.tags).toContain("easy_walk");
  });
});

describe("engineDataForParkCodes", () => {
  it("restricts the catalog but keeps upstream IDF/weights untouched", () => {
    const scoped = engineDataForParkCodes(["jotr", "YOSE", "xxxx"]);
    expect(scoped.catalog.map((p) => p.park_code).sort()).toEqual(["jotr", "yose"]);
    expect(scoped.vocab.tag_idf).toBe(ENGINE_DATA.vocab.tag_idf);
    expect(scoped.weights).toBe(ENGINE_DATA.weights);
  });

  it("per-park scores are identical to a full-catalog run (IDF is not recomputed)", () => {
    const profile = answersToRankingProfile(desertWeekendFromSD);
    const full = recommend(ENGINE_DATA, profile, 63);
    const scoped = recommend(engineDataForParkCodes(["jotr", "sagu", "yose"]), profile, 3);
    for (const p of scoped.parks) {
      const inFull = full.parks.find((f) => f.facts.park_code === p.facts.park_code);
      expect(inFull?.score).toBeCloseTo(p.score, 12);
    }
  });
});

describe("rankQuizDestinations", () => {
  const rows = [
    makeRow(),
    makeRow({ id: "dest-sagu", title: "Saguaro", slug: "saguaro", park_code: "sagu" }),
    makeRow({ id: "dest-yose", title: "Yosemite", slug: "yosemite", park_code: "yose", difficulty_level: "moderate" }),
  ];

  it("returns engine-ranked destinations with engine match_percent and Spanish reasons", () => {
    const outcome = rankQuizDestinations(rows, desertWeekendFromSD, 3);
    expect(outcome.engine_version).toBe(SUPPORTED_ENGINE_VERSION);
    expect(outcome.content_hash).toBe(ENGINE_DATA.content_hash);
    expect(outcome.candidate_park_codes.sort()).toEqual(["jotr", "sagu", "yose"]);
    expect(outcome.results.length).toBeGreaterThan(0);
    expect(outcome.results.length).toBeLessThanOrEqual(3);

    const first = outcome.results[0];
    // Engine decides the order (here: Saguaro's low budget/medium crowds beat
    // Joshua Tree's mid/high for a low-budget profile). We only pin the wiring.
    expect(["jotr", "sagu", "yose"]).toContain(first.destination.park_code);
    expect(first.destination.park_code).toBe(first.ranked.facts.park_code);
    expect(first.ranked.rank).toBe(1);
    expect(first.matchPercent).toBe(first.ranked.match_percent);
    expect(first.reasons.length).toBeGreaterThan(0);
    expect(first.reasons.join(" ")).toMatch(/desierto|senderismo|cielo estrellado/);
    // Spanish only — none of the engine's English `why` tokens leak through.
    expect(first.reasons.join(" ")).not.toMatch(/day trip|low crowds|drive/);
  });

  it("orders exactly as the engine does for the same scoped catalog", () => {
    const outcome = rankQuizDestinations(rows, desertWeekendFromSD, 3);
    const direct = recommend(engineDataForParkCodes(["jotr", "sagu", "yose"]), outcome.profile, 3);
    expect(outcome.results.map((r) => r.destination.park_code)).toEqual(direct.parks.map((p) => p.facts.park_code));
    expect(outcome.tie_groups).toEqual(direct.tie_groups);
  });

  it("ignores rows without a catalog park_code", () => {
    const outcome = rankQuizDestinations([makeRow({ park_code: null }), makeRow({ park_code: "xxxx" }), makeRow()], {}, 3);
    expect(outcome.candidate_park_codes).toEqual(["jotr"]);
    expect(outcome.results.map((r) => r.destination.park_code)).toEqual(["jotr"]);
  });

  it("relaxes the drive radius when it empties the catalog, and says so", () => {
    // Acadia (Maine) is far beyond 12 h from San Diego.
    const outcome = rankQuizDestinations([makeRow({ id: "dest-acad", park_code: "acad", title: "Acadia" })], desertWeekendFromSD, 3);
    expect(outcome.relaxed_drive_filter).toBe(true);
    expect(outcome.results).toHaveLength(1);
    expect(outcome.results[0].reasons).toContain("fuera de tu radio de manejo");
    expect(outcome.results[0].ranked.facts.drive_hours).toBeNull();
  });

  it("returns an empty outcome for an empty catalog", () => {
    const outcome = rankQuizDestinations([], desertWeekendFromSD, 3);
    expect(outcome.results).toEqual([]);
    expect(outcome.candidate_park_codes).toEqual([]);
  });
});

describe("buildSpanishReasons", () => {
  it("flags ties and off-season honestly", () => {
    const profile = answersToRankingProfile({ interest: "deserts", trip_duration: "weekend" });
    const park = recommend(engineDataForParkCodes(["jotr"]), profile, 1).parks[0];
    const reasons = buildSpanishReasons(
      { ...park, tied_with_neighbors: true, breakdown: { ...park.breakdown, month_penalty: 0.2 } },
      profile,
      false,
    );
    expect(reasons).toContain("empate técnico");
    expect(reasons).toContain("fuera de su mejor temporada");
    expect(reasons).toContain("viaje de 2-3 días");
  });
});
