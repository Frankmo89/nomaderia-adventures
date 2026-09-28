/**
 * Adapter tests: quiz answers → engine TripProfile → Spanish UI shape.
 * Scoring itself is covered by src/lib/engine/engine-parity.test.ts.
 */
import { describe, expect, it } from "vitest";
import { recommend } from "@engine/engine";
import { ENGINE_DATA } from "@engine/engine-data.generated";
import { lookupZipIn } from "@/lib/zip-centroids";
import { realZipTable } from "@/test/zcta-table";
import {
  DRIVE_HOUR_OPTIONS,
  InvalidProfileError,
  MONTH_UNKNOWN,
  SUPPORTED_ENGINE_VERSION,
  TRAVEL_MODES,
  answersToRankingProfile,
  buildSpanishReasons,
  engineDataForParkCodes,
  originAnswerFields,
  rankQuizDestinations,
  resolveProfileMonth,
  type QuizDestinationRow,
  type TravelMode,
} from "./quiz-ranking";

const zipTable = realZipTable();

/** Origin answers exactly as the quiz's origin screen would store them. */
function originFor(zip: string, travelMode: TravelMode, maxDriveHours?: "3" | "6" | "10"): Record<string, string> {
  const centroid = lookupZipIn(zipTable, zip);
  if (!centroid) throw new Error(`test ZIP ${zip} not in table`);
  return originAnswerFields({ zip, centroid, travelMode, maxDriveHours }).answers;
}

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

const desertWeekendFromSD: Record<string, string> = {
  interest: "deserts",
  fitness_level: "light_activity",
  trip_duration: "weekend",
  budget_range: "low",
  ...originFor("92101", "drive", "10"),
  month: "11",
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
      { interest: "nope", fitness_level: "nope", trip_duration: "nope", budget_range: "nope", travel_mode: "nope", month: "nope" },
      { ...originFor("99501", "drive", "3"), month: MONTH_UNKNOWN },
      { ...originFor("96813", "drive", "6"), month: "1" },
      { ...originFor("10001", "fly"), month: "12" },
    ];
    for (const answers of answerSets) {
      expect(() => recommend(ENGINE_DATA, answersToRankingProfile(answers), 3)).not.toThrow(InvalidProfileError);
    }
  });
});

describe("resolveProfileMonth", () => {
  it("reads the month answer (1–12)", () => {
    expect(resolveProfileMonth({ month: "1" })).toBe(1);
    expect(resolveProfileMonth({ month: "10" })).toBe(10);
    expect(resolveProfileMonth({ month: "12" })).toBe(12);
  });

  it("returns null for 'Aún no sé', a missing answer, or anything malformed", () => {
    for (const month of [MONTH_UNKNOWN, "", "0", "13", "abc", "1.5", "-3"]) {
      expect(resolveProfileMonth({ month }), month).toBeNull();
    }
    expect(resolveProfileMonth({})).toBeNull();
  });

  it("ignores the retired date and season answers", () => {
    expect(resolveProfileMonth({ trip_start_date: "2026-10-15" })).toBeNull();
    expect(resolveProfileMonth({ season: "next_month" })).toBeNull();
  });
});

describe("answersToRankingProfile — origin", () => {
  it("a San Diego driver gets a drive filter from their ZIP", () => {
    const profile = answersToRankingProfile(desertWeekendFromSD);
    expect(profile.biomes).toContain("desert");
    expect(profile.difficulty).toBe("easy");
    expect(profile.days_needed).toBe("2-3");
    expect(profile.budget_tier).toBe("low");
    expect(profile.month).toBe(11);
    expect(profile.origin_lat).toBeCloseTo(32.7, 1);
    expect(profile.origin_lon).toBeCloseTo(-117.2, 1);
    expect(profile.max_drive_hours).toBe(10);
    expect(profile.allow_remote).toBe(true);
  });

  it.each(DRIVE_HOUR_OPTIONS)("driving with a %s h limit sets exactly that limit", (hours) => {
    expect(answersToRankingProfile(originFor("80202", "drive", hours)).max_drive_hours).toBe(Number(hours));
  });

  it.each(["fly", "unsure"] as const)("'%s' sets no drive filter", (mode) => {
    const profile = answersToRankingProfile(originFor("92101", mode));
    expect(profile.origin_lat).toBeNull();
    expect(profile.origin_lon).toBeNull();
    expect(profile.max_drive_hours).toBeNull();
    expect(profile.allow_remote).toBe(true);
  });

  it("a driver without a valid hour bucket or coordinates gets no drive filter", () => {
    const base = originFor("92101", "drive", "6");
    expect(answersToRankingProfile({ ...base, max_drive_hours: "7" }).max_drive_hours).toBeNull();
    expect(answersToRankingProfile({ ...base, origin_lat: "" }).max_drive_hours).toBeNull();
    expect(answersToRankingProfile({ ...base, origin_lon: "nope" }).max_drive_hours).toBeNull();
  });

  it("driving from Hawaii or a territory means no drive filter (straight-line distance ignores the ocean)", () => {
    for (const zip of ["96813", "96720", "00901"]) {
      const profile = answersToRankingProfile(originFor(zip, "drive", "6"));
      expect(profile.max_drive_hours, zip).toBeNull();
      expect(profile.origin_lat, zip).toBeNull();
    }
  });

  it("driving from Alaska keeps the drive filter", () => {
    const profile = answersToRankingProfile(originFor("99501", "drive", "6"));
    expect(profile.origin_lat).toBeCloseTo(61.2, 1);
    expect(profile.max_drive_hours).toBe(6);
  });

  it("the retired city answers no longer influence the profile", () => {
    const answers = originFor("92101", "fly");
    for (const start_city of ["sandiego_socal", "los_angeles", "resto_usa", "otro"]) {
      expect(answersToRankingProfile({ ...answers, start_city, origin: start_city })).toEqual(answersToRankingProfile(answers));
    }
  });

  it("maps active fitness to challenging and two weeks to 7+", () => {
    const profile = answersToRankingProfile({
      interest: "mountains",
      fitness_level: "active",
      trip_duration: "two_weeks",
      budget_range: "high",
    });
    expect(profile.difficulty).toBe("challenging");
    expect(profile.days_needed).toBe("7+");
  });

  it("adds family + easy_walk tags when kids or older adults travel", () => {
    const profile = answersToRankingProfile({ interest: "mountains", group_kids: "true" });
    expect(profile.tags).toContain("family");
    expect(profile.tags).toContain("easy_walk");
  });
});

describe("allow_remote never depends on where the user lives", () => {
  // Mainland west/east/south/north, Alaska (road-connected and not), Hawaii,
  // American Samoa, Puerto Rico, a PO-box-only ZIP, and a rural ZIP.
  const zips = ["92101", "90009", "10001", "33101", "60601", "59901", "99501", "99801", "96813", "96799", "00901", "82190"];

  it("is true for every ZIP × travel mode × hour bucket, and every profile is valid for the engine", () => {
    for (const zip of zips) {
      for (const mode of TRAVEL_MODES) {
        const hourSets = mode === "drive" ? DRIVE_HOUR_OPTIONS : [undefined];
        for (const hours of hourSets) {
          const profile = answersToRankingProfile(originFor(zip, mode, hours));
          expect(profile.allow_remote, `${zip}/${mode}/${hours}`).toBe(true);
          expect(() => recommend(ENGINE_DATA, profile, 3), `${zip}/${mode}/${hours}`).not.toThrow();
        }
      }
    }
  });
});

describe("originAnswerFields — what is stored vs. what is logged", () => {
  const centroid = lookupZipIn(zipTable, "92101")!;

  it("stores the full ZIP and coordinates in the answers", () => {
    const { answers } = originAnswerFields({ zip: "92101", centroid, travelMode: "drive", maxDriveHours: "6" });
    expect(answers).toEqual({
      zip: "92101",
      zip_match: "exact",
      origin_lat: String(centroid.lat),
      origin_lon: String(centroid.lon),
      travel_mode: "drive",
      max_drive_hours: "6",
    });
  });

  it("logs only the 3-digit prefix — never the full ZIP or coordinates", () => {
    for (const travelMode of TRAVEL_MODES) {
      const { logFields } = originAnswerFields({ zip: "92101", centroid, travelMode, maxDriveHours: "6" });
      expect(logFields.zip3).toBe("921");
      expect(Object.keys(logFields)).not.toContain("zip");
      expect(Object.keys(logFields)).not.toContain("origin_lat");
      expect(Object.keys(logFields)).not.toContain("origin_lon");
      expect(Object.values(logFields)).not.toContain("92101");
    }
  });

  it("records the hour limit only for drivers", () => {
    expect(originAnswerFields({ zip: "92101", centroid, travelMode: "fly", maxDriveHours: "6" }).answers).not.toHaveProperty("max_drive_hours");
    expect(originAnswerFields({ zip: "92101", centroid, travelMode: "drive", maxDriveHours: "3" }).logFields.max_drive_hours).toBe("3");
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

  it("driving vs flying from the same ZIP: the hour limit decides reach", () => {
    const pair = [makeRow(), makeRow({ id: "dest-acad", park_code: "acad", title: "Acadia" })];
    // Joshua Tree is ~2–3 h from San Diego by the engine's estimate; Acadia is across the country.
    const driver = rankQuizDestinations(pair, { ...desertWeekendFromSD, ...originFor("92101", "drive", "3") }, 3);
    expect(driver.relaxed_drive_filter).toBe(false);
    expect(driver.results.map((r) => r.destination.park_code)).toEqual(["jotr"]);

    const flyer = rankQuizDestinations(pair, { ...desertWeekendFromSD, ...originFor("92101", "fly") }, 3);
    expect(flyer.results.map((r) => r.destination.park_code).sort()).toEqual(["acad", "jotr"]);
    expect(flyer.results.every((r) => r.ranked.facts.drive_hours === null)).toBe(true);
  });

  it("relaxes the drive radius when it empties the catalog, and says so", () => {
    // Acadia (Maine) is far beyond 10 h from San Diego.
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
