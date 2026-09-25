/**
 * Bridges quiz answers + destinations rows → RankingProfile / RankingPark.
 * Catalog attributes come from us-parks-recommender (RANKING_CATALOG).
 */

import {
  RANKING_ORIGINS,
  rankParks,
  type BudgetTier,
  type DaysNeeded,
  type Difficulty,
  type RankedPark,
  type RankingPark,
  type RankingProfile,
} from "@/lib/ranking";
import { RANKING_CATALOG } from "@/lib/ranking-catalog";

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

const FITNESS_TO_DIFFICULTY: Record<string, Difficulty> = {
  sedentary: "easy",
  light_activity: "easy",
  moderate: "moderate",
  active: "challenging",
};

const DURATION_TO_DAYS: Record<string, DaysNeeded> = {
  weekend: "2-3",
  one_week: "4-7",
  two_weeks: "7+",
};

const BUDGET_TO_TIER: Record<string, BudgetTier> = {
  low: "low",
  medium: "mid",
  high: "high",
  unlimited: "high",
};

const START_CITY_TO_ORIGIN: Record<string, keyof typeof RANKING_ORIGINS | null> = {
  sandiego_socal: "san_diego",
  los_angeles: "los_angeles",
  resto_usa: null,
  otro: null,
  // Legacy origin values still accepted if present
  tijuana_baja: "san_diego",
};

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

export function answersToRankingProfile(answers: Record<string, string>): RankingProfile {
  const interest = INTEREST_TO_PROFILE[answers.interest] ?? {
    biomes: ["forest", "desert", "canyon"],
    tags: ["hiking", "family", "scenic_drive"],
  };

  const startKey = answers.start_city || answers.origin || "";
  const originKey = START_CITY_TO_ORIGIN[startKey] ?? null;
  const origin = originKey ? RANKING_ORIGINS[originKey] : null;

  const hasKids = answers.group_kids === "true";
  const hasOlder = answers.group_older_adults === "true";
  const tags = [...interest.tags];
  if (hasKids || hasOlder) {
    if (!tags.includes("family")) tags.push("family");
    if (!tags.includes("easy_walk")) tags.push("easy_walk");
  }

  const profile: RankingProfile = {
    biomes: interest.biomes,
    tags,
    difficulty: FITNESS_TO_DIFFICULTY[answers.fitness_level] ?? "easy",
    days_needed: DURATION_TO_DAYS[answers.trip_duration] ?? "2-3",
    crowd_pref: hasKids || hasOlder ? "medium" : "medium",
    budget_tier: BUDGET_TO_TIER[answers.budget_range ?? answers.budget ?? ""] ?? "mid",
    month: resolveProfileMonth(answers),
    allow_remote: startKey === "resto_usa" || startKey === "otro",
    allow_permits: true,
  };

  if (origin) {
    profile.origin_lat = origin.lat;
    profile.origin_lon = origin.lon;
    // Soft drive preference for SoCal/LA — filter very remote only via allow_remote
    profile.max_drive_hours = startKey === "sandiego_socal" || startKey === "los_angeles" || startKey === "tijuana_baja"
      ? 12
      : null;
  }

  return profile;
}

export function destinationToRankingPark(row: QuizDestinationRow): RankingPark | null {
  const code = row.park_code?.toLowerCase() ?? "";
  if (!code || !RANKING_CATALOG[code]) return null;
  const cat = RANKING_CATALOG[code];
  return {
    ...cat,
    name: row.title,
    lat: row.latitude ?? cat.lat,
    lon: row.longitude ?? cat.lon,
    permit_likely: row.requires_permit ?? cat.permit_likely,
  };
}

/** Map hybrid score (~0–1) to the UI's 40–100 compatibility pill. */
export function rankingScoreToMatchPercent(score: number): number {
  const pct = Math.round(40 + Math.max(0, Math.min(1, score)) * 60);
  return Math.min(100, Math.max(40, pct));
}

export interface RankedQuizResult {
  destination: QuizDestinationRow;
  ranked: RankedPark;
  matchPercent: number;
}

/**
 * Rank published destinations that have a catalog park_code. Returns top `k`.
 */
export function rankQuizDestinations(
  rows: QuizDestinationRow[],
  answers: Record<string, string>,
  k = 3,
): RankedQuizResult[] {
  const parks: RankingPark[] = [];
  const byCode = new Map<string, QuizDestinationRow>();

  for (const row of rows) {
    const park = destinationToRankingPark(row);
    if (!park) continue;
    parks.push(park);
    byCode.set(park.park_code, row);
  }

  const profile = answersToRankingProfile(answers);
  let ranked = rankParks(parks, profile, k);

  // If month filter wiped the catalog, retry without month so the user still gets results.
  if (ranked.length === 0 && profile.month != null) {
    ranked = rankParks(parks, { ...profile, month: null }, k);
  }

  return ranked
    .map((r) => {
      const destination = byCode.get(r.park_code);
      if (!destination) return null;
      return {
        destination,
        ranked: r,
        matchPercent: rankingScoreToMatchPercent(r.score),
      };
    })
    .filter((x): x is RankedQuizResult => x != null);
}
