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

/** Quiz city choices → coordinates (same values as upstream `src/origins.py`). */
export const QUIZ_ORIGINS: Record<string, { lat: number; lon: number }> = {
  san_diego: { lat: 32.72, lon: -117.16 },
  los_angeles: { lat: 34.05, lon: -118.24 },
};

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

const START_CITY_TO_ORIGIN: Record<string, keyof typeof QUIZ_ORIGINS | null> = {
  sandiego_socal: "san_diego",
  los_angeles: "los_angeles",
  resto_usa: null,
  otro: null,
  // Legacy origin value still accepted if present
  tijuana_baja: "san_diego",
};

/** Soft drive radius for SoCal starts (hours). Relaxed automatically if it empties the catalog. */
export const SOCAL_MAX_DRIVE_HOURS = 12;

/** Parse month (1–12) from ISO date string or season quiz answer. */
export function resolveProfileMonth(answers: Record<string, string>): number | null {
  const start = answers.trip_start_date;
  if (start && /^\d{4}-\d{2}-\d{2}$/.test(start)) {
    const month = Number(start.slice(5, 7));
    if (month >= 1 && month <= 12) return month;
  }

  const season = answers.season;
  if (!season || season === "flexible") return null;

  const now = new Date();
  if (season === "next_month") return ((now.getMonth() + 1) % 12) + 1;
  if (season === "three_months") return ((now.getMonth() + 3) % 12) + 1;
  if (season === "six_months") return ((now.getMonth() + 6) % 12) + 1;
  return null;
}

export function answersToRankingProfile(answers: Record<string, string>): TripProfile {
  const interest = INTEREST_TO_PROFILE[answers.interest] ?? {
    biomes: ["forest", "desert", "canyon"],
    tags: ["hiking", "family", "scenic_drive"],
  };

  const startKey = answers.start_city || answers.origin || "";
  const originKey = START_CITY_TO_ORIGIN[startKey] ?? null;
  const origin = originKey ? QUIZ_ORIGINS[originKey] : null;

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
    allow_remote: startKey === "resto_usa" || startKey === "otro",
    allow_permits: true,
  };

  if (origin) {
    profile.origin_lat = origin.lat;
    profile.origin_lon = origin.lon;
    profile.max_drive_hours = SOCAL_MAX_DRIVE_HOURS;
  }

  return profile;
}

/**
 * Engine data restricted to the given park codes. `vocab.tag_idf` is left as
 * exported (computed upstream over the full catalog) so per-park scores stay
 * identical to the upstream fixtures regardless of how many destinations are
 * published.
 */
export function engineDataForParkCodes(codes: Iterable<string>, data: EngineData = ENGINE_DATA): EngineData {
  const wanted = new Set(Array.from(codes, (c) => c.toLowerCase()));
  return { ...data, catalog: data.catalog.filter((p) => wanted.has(p.park_code)) };
}

// ─── Spanish presentation of engine facts (display only; never affects order) ──

const BIOME_LABELS_ES: Record<string, string> = {
  alpine: "alta montaña",
  canyon: "cañones",
  cave: "cuevas",
  chaparral: "chaparral",
  coast: "costa",
  desert: "desierto",
  forest: "bosque",
  island: "isla",
  prairie: "pradera",
  rainforest: "bosque lluvioso",
  tundra: "tundra",
  urban: "urbano",
  volcano: "volcán",
  wetland: "humedales",
};

const TAG_LABELS_ES: Record<string, string> = {
  "4x4": "rutas 4x4",
  archaeology: "arqueología",
  backpacking: "mochileo",
  beach: "playa",
  bears: "osos",
  biking: "ciclismo",
  birding: "aves",
  boardwalk: "pasarelas",
  boat: "paseos en bote",
  camping: "camping",
  climbing: "escalada",
  easy_walk: "caminatas fáciles",
  family: "para familias",
  fishing: "pesca",
  geothermal: "geotermia",
  giant_trees: "árboles gigantes",
  glacier: "glaciares",
  hiking: "senderismo",
  history: "historia",
  hot_springs: "aguas termales",
  kayak: "kayak",
  paleontology: "fósiles",
  photography: "fotografía",
  sand: "dunas",
  scenic_drive: "ruta escénica",
  snorkeling: "snorkel",
  stargazing: "cielo estrellado",
  sunrise: "amanecer",
  water: "agua",
  waterfalls: "cascadas",
  wilderness: "naturaleza salvaje",
  wildflowers: "flores silvestres",
  wildlife: "fauna",
  winter: "invierno",
};

/** Month penalty at or above this (≈2+ months off-season) earns an honest chip. */
const OFF_SEASON_PENALTY_THRESHOLD = 0.1;

export function buildSpanishReasons(park: RankedPark, profile: TripProfile, relaxedDrive: boolean): string[] {
  const bits: string[] = [];
  for (const b of park.facts.biomes) bits.push(BIOME_LABELS_ES[b] ?? b);

  const parkTags = new Set(park.facts.tags);
  let added = 0;
  for (const tag of profile.tags) {
    if (parkTags.has(tag) && added < 3) {
      bits.push(TAG_LABELS_ES[tag] ?? tag);
      added += 1;
    }
  }

  if ((profile.days_needed ?? "2-3") === park.facts.days_needed) {
    bits.push(`viaje de ${park.facts.days_needed} días`);
  }
  if (park.facts.crowd === "low") bits.push("pocas multitudes");
  if (park.facts.drive_hours != null) bits.push(`~${park.facts.drive_hours.toFixed(1)} h en auto (estimado)`);
  if (relaxedDrive) bits.push("fuera de tu radio de manejo");
  if (park.breakdown.month_penalty >= OFF_SEASON_PENALTY_THRESHOLD) bits.push("fuera de su mejor temporada");
  if (park.tied_with_neighbors) bits.push("empate técnico");
  return bits;
}

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
