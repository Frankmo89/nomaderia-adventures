/**
 * Adapter: quiz answers + published `destinations` → vendored ranking engine.
 *
 * The engine itself (`@engine/engine`, `@engine/engine-data.generated`) is
 * synced byte-for-byte from Frankmo89/us-parks-recommender by
 * `scripts/sync-engine.ts` — nothing in this file scores parks. This file only:
 *   1. maps quiz answers → `TripProfile` (contract §1),
 *   2. restricts the engine catalog to parks that exist as published destinations,
 *   3. translates engine output into the Spanish UI shape the quiz already renders.
 *
 * Contract: docs/engine-contract.md upstream. Catalog attributes (lat/lon,
 * permit_likely, …) come from the engine catalog only — `destinations` is just
 * the display join, never an override (a catalog edit is a breaking engine change).
 */

import {
  InvalidProfileError,
  recommend,
  type EngineData,
  type RankedPark,
  type RecommendResult,
  type TripProfile,
} from "@engine/engine";
import { ENGINE_DATA } from "@engine/engine-data.generated";
import { buildSpanishReasons, engineDataForParkCodes } from "@shared/engine-es";
import { isIslandZip, type ZipCentroid } from "@/lib/zip-centroids";

/**
 * The engine_version this adapter was written and reviewed against. The Vitest
 * guard in quiz-ranking.test.ts fails when the vendored data moves to another
 * version, so a `sync:engine` bump forces a human re-read of the contract.
 */
export const SUPPORTED_ENGINE_VERSION = "0.2.0";

export { InvalidProfileError };
export type { TripProfile, RankedPark, RecommendResult };

export interface QuizDestinationRow {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  difficulty_level: string;
  country: string;
  estimated_budget_usd: number | null;
  days_needed: string | null;
  hero_image_url: string | null;
  experience_type: string | null;
  region: string | null;
  tags: string[] | null;
  best_season: string | null;
  park_code: string | null;
  latitude: number | null;
  longitude: number | null;
  requires_permit: boolean | null;
}

const INTEREST_TO_PROFILE: Record<string, { biomes: string[]; tags: string[] }> = {
  mountains: { biomes: ["alpine", "forest"], tags: ["hiking", "scenic_drive", "photography", "backpacking"] },
  forests: { biomes: ["forest", "rainforest"], tags: ["hiking", "giant_trees", "wildlife", "family"] },
  deserts: { biomes: ["desert", "canyon"], tags: ["hiking", "desert", "stargazing", "scenic_drive"] },
  cultural: { biomes: ["canyon", "urban", "cave"], tags: ["history", "archaeology", "easy_walk", "family"] },
};

const FITNESS_TO_DIFFICULTY: Record<string, string> = {
  sedentary: "easy",
  light_activity: "easy",
  moderate: "moderate",
  active: "challenging",
};

const DURATION_TO_DAYS: Record<string, string> = {
  weekend: "2-3",
  one_week: "4-7",
  two_weeks: "7+",
};

const BUDGET_TO_TIER: Record<string, string> = {
  low: "low",
  medium: "mid",
  high: "high",
  unlimited: "high",
};

// ─── Origin (ZIP + travel mode) and month answers ────────────────────────────
//
// Answer keys written by the quiz's origin screen (see originAnswerFields):
//   zip, zip_match ("exact" | "nearby"), origin_lat, origin_lon,
//   travel_mode ("drive" | "fly" | "unsure"), max_drive_hours ("3" | "6" | "10", drive only)
// and by the month screen:
//   month ("1".."12" | "unknown")
// The ZIP is resolved to coordinates when the user submits the origin screen,
// so this mapping stays synchronous and never touches the ZIP table.

export type TravelMode = "drive" | "fly" | "unsure";
export const TRAVEL_MODES: readonly TravelMode[] = ["drive", "fly", "unsure"];
export const DRIVE_HOUR_OPTIONS = ["3", "6", "10"] as const;
export const MONTH_UNKNOWN = "unknown";

/** Month answer → engine month (1–12), or null = "Aún no sé" / missing / malformed. */
export function resolveProfileMonth(answers: Record<string, string>): number | null {
  const raw = answers.month;
  if (!raw || !/^\d{1,2}$/.test(raw)) return null;
  const month = Number(raw);
  return month >= 1 && month <= 12 ? month : null;
}

function parseCoord(value: string | undefined, min: number, max: number): number | null {
  if (value == null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

/**
 * Drive filter from the origin answers, or null for "no drive filter".
 * Only a driver with a placeable ZIP, a known hour bucket, and a ZIP where
 * driving means a road trip (not Hawaii or a territory — the engine's drive
 * estimate is straight-line and would call Maui a two-hour drive from
 * Honolulu) gets one.
 */
function driveFilter(answers: Record<string, string>): { lat: number; lon: number; hours: number } | null {
  if (answers.travel_mode !== "drive") return null;
  if (!(DRIVE_HOUR_OPTIONS as readonly string[]).includes(answers.max_drive_hours ?? "")) return null;
  if (answers.zip && isIslandZip(answers.zip)) return null;
  const lat = parseCoord(answers.origin_lat, -90, 90);
  const lon = parseCoord(answers.origin_lon, -180, 180);
  if (lat === null || lon === null) return null;
  return { lat, lon, hours: Number(answers.max_drive_hours) };
}

export interface OriginInput {
  zip: string;
  centroid: ZipCentroid;
  travelMode: TravelMode;
  /** Required when travelMode is "drive". */
  maxDriveHours?: (typeof DRIVE_HOUR_OPTIONS)[number];
}

/**
 * What the origin screen stores vs. what it logs. The full ZIP and its
 * coordinates go into the answers (they reach `leads.quiz_answers`, which the
 * post-payment itinerary needs). `events` accepts anonymous inserts and is
 * tied to a session, so it only gets the 3-digit prefix — never the full ZIP
 * or the coordinates (ADR-031).
 */
export function originAnswerFields(input: OriginInput): {
  answers: Record<string, string>;
  logFields: Record<string, string>;
} {
  const answers: Record<string, string> = {
    zip: input.zip,
    zip_match: input.centroid.match,
    origin_lat: String(input.centroid.lat),
    origin_lon: String(input.centroid.lon),
    travel_mode: input.travelMode,
  };
  const logFields: Record<string, string> = {
    zip3: input.zip.slice(0, 3),
    zip_match: input.centroid.match,
    travel_mode: input.travelMode,
  };
  if (input.travelMode === "drive" && input.maxDriveHours) {
    answers.max_drive_hours = input.maxDriveHours;
    logFields.max_drive_hours = input.maxDriveHours;
  }
  return { answers, logFields };
}

export function answersToRankingProfile(answers: Record<string, string>): TripProfile {
  const interest = INTEREST_TO_PROFILE[answers.interest] ?? {
    biomes: ["forest", "desert", "canyon"],
    tags: ["hiking", "family", "scenic_drive"],
  };

  const hasKids = answers.group_kids === "true";
  const hasOlder = answers.group_older_adults === "true";
  const tags = [...interest.tags];
  if (hasKids || hasOlder) {
    if (!tags.includes("family")) tags.push("family");
    if (!tags.includes("easy_walk")) tags.push("easy_walk");
  }

  const profile: TripProfile = {
    biomes: interest.biomes,
    tags,
    difficulty: FITNESS_TO_DIFFICULTY[answers.fitness_level] ?? "easy",
    days_needed: DURATION_TO_DAYS[answers.trip_duration] ?? "2-3",
    crowd_pref: "medium",
    budget_tier: BUDGET_TO_TIER[answers.budget_range ?? answers.budget ?? ""] ?? "mid",
    month: resolveProfileMonth(answers),
    origin_lat: null,
    origin_lon: null,
    max_drive_hours: null,
    // Never derived from where the user lives (ADR-031): the drive-hour limit
    // decides reach for drivers, and remote parks (AK, HI, ferry) stay
    // eligible for everyone. Frank's itinerary review catches the rare odd
    // pick (e.g. Lake Clark for an Anchorage driver).
    allow_remote: true,
    allow_permits: true,
  };

  const drive = driveFilter(answers);
  if (drive) {
    profile.origin_lat = drive.lat;
    profile.origin_lon = drive.lon;
    profile.max_drive_hours = drive.hours;
  }

  return profile;
}

// Catalog scoping + Spanish reason chips live in _shared/engine-es.ts so the
// Edge Functions (quiz-preview, concierge-agent) use the exact same code.
export { buildSpanishReasons, engineDataForParkCodes };

// ─── Ranking entry point used by use-quiz ────────────────────────────────────

export interface RankedQuizResult {
  destination: QuizDestinationRow;
  ranked: RankedPark;
  /** Engine `match_percent` (display-only fit score, 0–100). */
  matchPercent: number;
  /** Spanish reason chips derived from `facts`/`breakdown`. */
  reasons: string[];
}

export interface QuizRankingOutcome {
  results: RankedQuizResult[];
  profile: TripProfile;
  engine_version: string;
  content_hash: string;
  tie_groups: string[][];
  /** True when the drive-radius hard filter emptied the catalog and was dropped for a retry. */
  relaxed_drive_filter: boolean;
  /** Park codes the engine ranked over (published destinations with a catalog code). */
  candidate_park_codes: string[];
}

/**
 * Rank published destinations that have an engine catalog park_code. Returns
 * the top `k`. Throws `InvalidProfileError` if the profile violates the contract
 * (cannot happen with the fixed maps above, but callers should still catch).
 */
export function rankQuizDestinations(
  rows: QuizDestinationRow[],
  answers: Record<string, string>,
  k = 3,
  data: EngineData = ENGINE_DATA,
): QuizRankingOutcome {
  const byCode = new Map<string, QuizDestinationRow>();
  for (const row of rows) {
    const code = row.park_code?.toLowerCase();
    if (code) byCode.set(code, row);
  }
  const scoped = engineDataForParkCodes(byCode.keys(), data);
  const candidate_park_codes = scoped.catalog.map((p) => p.park_code);

  const profile = answersToRankingProfile(answers);
  let result = recommend(scoped, profile, k);
  let relaxed = false;

  // Contract §3: empty is valid — loosen the drive radius (the only hard filter
  // the quiz sets from a soft preference) rather than show nothing.
  if (result.empty && profile.max_drive_hours != null) {
    result = recommend(scoped, { ...profile, max_drive_hours: null }, k);
    relaxed = true;
  }

  const results: RankedQuizResult[] = [];
  for (const park of result.parks) {
    const destination = byCode.get(park.facts.park_code);
    if (!destination) continue;
    results.push({
      destination,
      ranked: park,
      matchPercent: park.match_percent,
      reasons: buildSpanishReasons(park, profile, relaxed),
    });
  }

  return {
    results,
    profile,
    engine_version: result.engine_version,
    content_hash: data.content_hash,
    tie_groups: result.tie_groups,
    relaxed_drive_filter: relaxed,
    candidate_park_codes,
  };
}
