/**
 * Hybrid park ranker — port of Frankmo89/us-parks-recommender
 * (`src/recommender.py` + `src/features.py`).
 *
 * Pure TypeScript: no network I/O. Callers pass the park catalog (e.g. mapped
 * from `destinations` via `quiz-ranking.ts`). Wired into the quiz in T05
 * (`use-quiz.ts` → `rankQuizDestinations` → `rankParks`).
 *
 * Weights (frozen in upstream, not retuned):
 *   W_CONTENT=0.55, W_DAYS=0.18, W_DIFF=0.14, W_BUDGET=0.08, CROWD_PENALTY=0.12
 */

export const BIOMES = [
  "alpine",
  "canyon",
  "cave",
  "chaparral",
  "coast",
  "desert",
  "forest",
  "island",
  "prairie",
  "rainforest",
  "tundra",
  "urban",
  "volcano",
  "wetland",
] as const;

export const TAG_VOCAB = [
  "4x4",
  "archaeology",
  "backpacking",
  "beach",
  "bears",
  "biking",
  "birding",
  "boardwalk",
  "boat",
  "camping",
  "climbing",
  "easy_walk",
  "family",
  "fishing",
  "geothermal",
  "giant_trees",
  "glacier",
  "hiking",
  "history",
  "hot_springs",
  "kayak",
  "paleontology",
  "photography",
  "sand",
  "scenic_drive",
  "snorkeling",
  "stargazing",
  "sunrise",
  "water",
  "waterfalls",
  "wilderness",
  "wildflowers",
  "wildlife",
  "winter",
] as const;

export type DaysNeeded = "1" | "2-3" | "4-7" | "7+";
export type Difficulty = "easy" | "moderate" | "challenging";
export type BudgetTier = "low" | "mid" | "high";
export type CrowdLevel = "low" | "medium" | "high";

export const DAYS_ORD: Record<DaysNeeded, number> = {
  "1": 0,
  "2-3": 1,
  "4-7": 2,
  "7+": 3,
};

export const DIFF_ORD: Record<Difficulty, number> = {
  easy: 0,
  moderate: 1,
  challenging: 2,
};

export const BUDGET_ORD: Record<BudgetTier, number> = {
  low: 0,
  mid: 1,
  high: 2,
};

export const CROWD_RANK: Record<CrowdLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

export const W_CONTENT = 0.55;
export const W_DAYS = 0.18;
export const W_DIFF = 0.14;
export const W_BUDGET = 0.08;
export const CROWD_PENALTY = 0.12;

/** Great-circle miles * detour / highway speed (upstream constants). */
export const DRIVE_DETOUR = 1.25;
export const DRIVE_MPH = 65.0;
const EARTH_RADIUS_MILES = 3958.8;

/** City origins from upstream `src/origins.py` (San Diego–centric product). */
export const RANKING_ORIGINS: Record<string, { lat: number; lon: number }> = {
  san_diego: { lat: 32.72, lon: -117.16 },
  los_angeles: { lat: 34.05, lon: -118.24 },
  phoenix: { lat: 33.45, lon: -112.07 },
  denver: { lat: 39.74, lon: -104.99 },
  seattle: { lat: 47.61, lon: -122.33 },
  salt_lake: { lat: 40.76, lon: -111.89 },
  nyc: { lat: 40.71, lon: -74.01 },
};

export interface RankingPark {
  park_code: string;
  name: string;
  lat: number;
  lon: number;
  biome: string;
  /** Pipe-separated string or array of activity tags. */
  tags: string | string[];
  difficulty: Difficulty;
  days_needed: DaysNeeded;
  /** Comma-separated month numbers (e.g. "10,11,12,1") or number[]. */
  best_months: string | number[];
  crowd: CrowdLevel;
  permit_likely: boolean | 0 | 1;
  budget_tier: BudgetTier;
  remote: boolean | 0 | 1;
}

export interface RankingProfile {
  biomes: string[];
  tags: string[];
  difficulty?: Difficulty;
  days_needed?: DaysNeeded;
  crowd_pref?: CrowdLevel;
  budget_tier?: BudgetTier;
  month?: number | null;
  origin_lat?: number | null;
  origin_lon?: number | null;
  max_drive_hours?: number | null;
  allow_remote?: boolean;
  allow_permits?: boolean;
}

export interface RankedPark {
  park_code: string;
  name: string;
  score: number;
  /** Human-readable reason chips (Spanish descriptive bits; biome/tags as catalog codes). */
  reasons: string[];
  /** Joined reasons (upstream `why` string). */
  why: string;
  content: number;
  days_fit: number;
  diff_fit: number;
  budget_fit: number;
  crowd_penalty: number;
  drive_hours: number | null;
  biome: string;
}

export function parseTags(raw: string | string[]): string[] {
  if (Array.isArray(raw)) {
    return raw.map((t) => t.trim()).filter(Boolean);
  }
  return String(raw)
    .split("|")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function parseMonths(raw: string | number[]): Set<string> {
  if (Array.isArray(raw)) {
    return new Set(raw.map((m) => String(m).trim()).filter(Boolean));
  }
  return new Set(
    String(raw)
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
  );
}

function asBool(value: boolean | 0 | 1): boolean {
  return value === true || value === 1;
}

/** 1 if identical, 0 if as far as the scale allows. */
export function closeness(parkLevel: number, userLevel: number, span: number): number {
  if (span <= 0) return 1;
  return 1 - Math.min(Math.abs(parkLevel - userLevel) / span, 1);
}

/** Upstream drive-hours estimate (crow-flies × detour / 65 mph). */
export function driveHours(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const p1 = toRad(lat1);
  const p2 = toRad(lat2);
  const dphi = toRad(lat2 - lat1);
  const dlmb = toRad(lon2 - lon1);
  const a =
    Math.sin(dphi / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dlmb / 2) ** 2;
  const miles = 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
  return (miles * DRIVE_DETOUR) / DRIVE_MPH;
}

function multiHot(values: string[], vocab: readonly string[]): number[] {
  const index = new Map(vocab.map((name, i) => [name, i]));
  const vec = new Array(vocab.length).fill(0);
  for (const item of values) {
    const i = index.get(item);
    if (i !== undefined) vec[i] = 1;
  }
  return vec;
}

/** Smoothed IDF over TAG_VOCAB from a park catalog's tags. */
export function tagIdf(parks: RankingPark[]): number[] {
  const n = Math.max(parks.length, 1);
  const counts = new Array(TAG_VOCAB.length).fill(0);
  const index = new Map(TAG_VOCAB.map((name, i) => [name, i]));
  for (const park of parks) {
    for (const tag of new Set(parseTags(park.tags))) {
      const i = index.get(tag as (typeof TAG_VOCAB)[number]);
      if (i !== undefined) counts[i] += 1;
    }
  }
  return counts.map((c) => Math.log((n + 1) / (c + 1)));
}

export function contentVectorFromParts(
  biomes: string[],
  tags: string[],
  idf?: number[] | null,
): number[] {
  const tagVec = multiHot(tags, TAG_VOCAB);
  const weighted = idf ? tagVec.map((v, i) => v * idf[i]) : tagVec;
  return [...multiHot(biomes, BIOMES), ...weighted];
}

function l2Normalize(vec: number[]): number[] {
  let sumSq = 0;
  for (const v of vec) sumSq += v * v;
  const norm = Math.max(Math.sqrt(sumSq), 1e-12);
  return vec.map((v) => v / norm);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const na = l2Normalize(a);
  const nb = l2Normalize(b);
  let dot = 0;
  for (let i = 0; i < na.length; i++) dot += na[i] * nb[i];
  return dot;
}

function buildReasons(
  park: RankingPark,
  profile: RankingProfile,
  driveHrs: number | null,
): string[] {
  const bits: string[] = [park.biome];
  const parkTags = new Set(parseTags(park.tags));
  bits.push(...profile.tags.filter((t) => parkTags.has(t)).slice(0, 3));
  const days = profile.days_needed ?? "2-3";
  if (days === park.days_needed) {
    bits.push(`viaje ${park.days_needed} días`);
  }
  if (park.crowd === "low") {
    bits.push("pocas multitudes");
  }
  if (driveHrs != null && Number.isFinite(driveHrs)) {
    bits.push(`~${driveHrs.toFixed(1)}h en auto`);
  }
  return bits;
}

interface ScoredRow {
  park: RankingPark;
  content: number;
  days_fit: number;
  diff_fit: number;
  budget_fit: number;
  crowd_penalty: number;
  score: number;
  drive_hours: number | null;
}

/**
 * Rank parks for a trip profile. Returns the top `k` (default 3) with scores
 * and reasons. Empty catalog or empty filter → [].
 */
export function rankParks(
  parks: RankingPark[],
  profile: RankingProfile,
  k = 3,
): RankedPark[] {
  if (parks.length === 0 || k <= 0) return [];

  const difficulty = profile.difficulty ?? "easy";
  const daysNeeded = profile.days_needed ?? "2-3";
  const crowdPref = profile.crowd_pref ?? "medium";
  const budgetTier = profile.budget_tier ?? "mid";
  const allowRemote = profile.allow_remote ?? true;
  const allowPermits = profile.allow_permits ?? true;

  const idf = tagIdf(parks);
  const userVec = contentVectorFromParts(profile.biomes, profile.tags, idf);

  const daysU = DAYS_ORD[daysNeeded];
  const diffU = DIFF_ORD[difficulty];
  const budgetU = BUDGET_ORD[budgetTier];
  const crowdU = CROWD_RANK[crowdPref];

  const hasDriveFilter =
    profile.origin_lat != null &&
    profile.origin_lon != null &&
    profile.max_drive_hours != null;

  const scored: ScoredRow[] = [];

  for (const park of parks) {
    if (profile.month != null) {
      const months = parseMonths(park.best_months);
      if (!months.has(String(profile.month))) continue;
    }
    if (!allowRemote && asBool(park.remote)) continue;
    if (!allowPermits && asBool(park.permit_likely)) continue;

    let driveHrs: number | null = null;
    if (
      profile.origin_lat != null &&
      profile.origin_lon != null
    ) {
      driveHrs = driveHours(
        profile.origin_lat,
        profile.origin_lon,
        park.lat,
        park.lon,
      );
      if (hasDriveFilter && driveHrs > (profile.max_drive_hours as number)) {
        continue;
      }
    }

    const parkVec = contentVectorFromParts([park.biome], parseTags(park.tags), idf);
    const content = cosineSimilarity(userVec, parkVec);
    const daysFit = closeness(DAYS_ORD[park.days_needed], daysU, 3);
    const diffFit = closeness(DIFF_ORD[park.difficulty], diffU, 2);
    const budgetFit = closeness(BUDGET_ORD[park.budget_tier], budgetU, 2);
    const crowdGap = Math.max(0, CROWD_RANK[park.crowd] - crowdU);
    const crowdPenalty = crowdGap * CROWD_PENALTY;

    const score =
      W_CONTENT * content +
      W_DAYS * daysFit +
      W_DIFF * diffFit +
      W_BUDGET * budgetFit -
      crowdPenalty;

    scored.push({
      park,
      content,
      days_fit: daysFit,
      diff_fit: diffFit,
      budget_fit: budgetFit,
      crowd_penalty: crowdPenalty,
      score,
      drive_hours: driveHrs,
    });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, k).map((row) => {
    const reasons = buildReasons(row.park, { ...profile, days_needed: daysNeeded }, row.drive_hours);
    return {
      park_code: row.park.park_code,
      name: row.park.name,
      score: row.score,
      reasons,
      why: reasons.join(" · "),
      content: row.content,
      days_fit: row.days_fit,
      diff_fit: row.diff_fit,
      budget_fit: row.budget_fit,
      crowd_penalty: row.crowd_penalty,
      drive_hours: row.drive_hours,
      biome: row.park.biome,
    };
  });
}
