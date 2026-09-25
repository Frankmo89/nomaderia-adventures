import { describe, it, expect } from "vitest";
import {
  closeness,
  driveHours,
  rankParks,
  RANKING_ORIGINS,
  type RankingPark,
  type RankingProfile,
} from "./ranking";

/** Subset of upstream parks.csv used as a pure fixture (no network). */
const FIXTURE_PARKS: RankingPark[] = [
  {
    park_code: "deva",
    name: "Death Valley National Park",
    lat: 36.24,
    lon: -116.82,
    biome: "desert",
    tags: "hiking|scenic_drive|stargazing|desert|photography|family",
    difficulty: "moderate",
    days_needed: "2-3",
    best_months: "11,12,1,2,3",
    crowd: "medium",
    permit_likely: 0,
    budget_tier: "mid",
    remote: 0,
  },
  {
    park_code: "grca",
    name: "Grand Canyon National Park",
    lat: 36.06,
    lon: -112.14,
    biome: "canyon",
    tags: "hiking|scenic_drive|family|photography|backpacking|canyon",
    difficulty: "moderate",
    days_needed: "2-3",
    best_months: "4,5,9,10",
    crowd: "high",
    permit_likely: 1,
    budget_tier: "mid",
    remote: 0,
  },
  {
    park_code: "jotr",
    name: "Joshua Tree National Park",
    lat: 33.79,
    lon: -115.9,
    biome: "desert",
    tags: "hiking|climbing|stargazing|desert|camping|family|photography",
    difficulty: "easy",
    days_needed: "2-3",
    best_months: "10,11,12,1,2,3,4",
    crowd: "high",
    permit_likely: 0,
    budget_tier: "mid",
    remote: 0,
  },
  {
    park_code: "sagu",
    name: "Saguaro National Park",
    lat: 32.25,
    lon: -110.5,
    biome: "desert",
    tags: "hiking|family|desert|stargazing|easy_walk",
    difficulty: "easy",
    days_needed: "1",
    best_months: "11,12,1,2,3,4",
    crowd: "medium",
    permit_likely: 0,
    budget_tier: "low",
    remote: 0,
  },
  {
    park_code: "yose",
    name: "Yosemite National Park",
    lat: 37.75,
    lon: -119.6,
    biome: "alpine",
    tags: "hiking|scenic_drive|family|waterfalls|backpacking|climbing|photography",
    difficulty: "moderate",
    days_needed: "2-3",
    best_months: "5,6,7,8,9,10",
    crowd: "high",
    permit_likely: 1,
    budget_tier: "mid",
    remote: 0,
  },
  {
    park_code: "zion",
    name: "Zion National Park",
    lat: 37.3,
    lon: -113.05,
    biome: "canyon",
    tags: "hiking|canyon|family|photography|scenic_drive|permits",
    difficulty: "moderate",
    days_needed: "2-3",
    best_months: "3,4,5,10,11",
    crowd: "high",
    permit_likely: 1,
    budget_tier: "mid",
    remote: 0,
  },
  {
    park_code: "npsa",
    name: "National Park of American Samoa",
    lat: -14.26,
    lon: -170.68,
    biome: "rainforest",
    tags: "hiking|coast|wildlife|family",
    difficulty: "moderate",
    days_needed: "2-3",
    best_months: "5,6,7,8,9",
    crowd: "low",
    permit_likely: 0,
    budget_tier: "high",
    remote: 1,
  },
];

const SD = RANKING_ORIGINS.san_diego;

describe("closeness", () => {
  it("prefers the same ordinal bin", () => {
    expect(closeness(2, 2, 3)).toBe(1);
    expect(closeness(2, 2, 3)).toBeGreaterThan(closeness(3, 2, 3));
    expect(closeness(0, 0, 3)).toBe(1);
  });
});

describe("driveHours", () => {
  it("estimates San Diego → Joshua Tree between 1.5h and 3.5h", () => {
    const jotr = FIXTURE_PARKS.find((p) => p.park_code === "jotr")!;
    const hours = driveHours(SD.lat, SD.lon, jotr.lat, jotr.lon);
    expect(hours).toBeGreaterThan(1.5);
    expect(hours).toBeLessThan(3.5);
  });

  it("ranks Joshua Tree closer than Saguaro from San Diego", () => {
    const jotr = FIXTURE_PARKS.find((p) => p.park_code === "jotr")!;
    const sagu = FIXTURE_PARKS.find((p) => p.park_code === "sagu")!;
    const hJotr = driveHours(SD.lat, SD.lon, jotr.lat, jotr.lon);
    const hSagu = driveHours(SD.lat, SD.lon, sagu.lat, sagu.lon);
    expect(hSagu).toBeLessThan(8);
    expect(hJotr).toBeLessThan(hSagu);
  });
});

describe("rankParks", () => {
  it("returns at most top 3 by default with scores and reasons", () => {
    const profile: RankingProfile = {
      biomes: ["desert"],
      tags: ["hiking", "stargazing"],
      difficulty: "easy",
      days_needed: "2-3",
      month: 11,
      allow_remote: false,
    };
    const ranked = rankParks(FIXTURE_PARKS, profile);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.length).toBeLessThanOrEqual(3);
    for (const row of ranked) {
      expect(row.score).toBeTypeOf("number");
      expect(row.reasons.length).toBeGreaterThan(0);
      expect(row.why).toContain(row.biome);
      expect(row.park_code).toBeTruthy();
      expect(row.name).toBeTruthy();
    }
    // Scores are non-increasing
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });

  it("surfaces desert parks for a desert November profile", () => {
    const ranked = rankParks(FIXTURE_PARKS, {
      biomes: ["desert"],
      tags: ["hiking"],
      month: 11,
      allow_remote: false,
    });
    expect(ranked.some((r) => r.biome === "desert")).toBe(true);
    expect(ranked.every((r) => r.park_code !== "npsa")).toBe(true);
  });

  it("keeps Joshua Tree and Saguaro inside an 8h San Diego radius", () => {
    const ranked = rankParks(
      FIXTURE_PARKS,
      {
        biomes: ["desert"],
        tags: ["hiking", "stargazing", "family"],
        difficulty: "easy",
        days_needed: "2-3",
        month: 11,
        origin_lat: SD.lat,
        origin_lon: SD.lon,
        max_drive_hours: 8,
        allow_remote: false,
      },
      8,
    );
    const codes = ranked.map((r) => r.park_code);
    expect(codes).toContain("jotr");
    expect(codes).toContain("sagu");
  });

  it("returns [] for an empty catalog", () => {
    expect(rankParks([], { biomes: ["desert"], tags: ["hiking"] })).toEqual([]);
  });

  it("filters out permit-likely parks when allow_permits is false", () => {
    const ranked = rankParks(
      FIXTURE_PARKS,
      {
        biomes: ["canyon", "alpine"],
        tags: ["hiking"],
        month: 5,
        allow_permits: false,
        allow_remote: false,
      },
      10,
    );
    expect(ranked.every((r) => r.park_code !== "yose")).toBe(true);
    expect(ranked.every((r) => r.park_code !== "grca")).toBe(true);
    expect(ranked.every((r) => r.park_code !== "zion")).toBe(true);
  });
});
