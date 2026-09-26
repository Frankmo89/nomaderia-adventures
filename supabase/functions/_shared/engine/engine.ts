/**
 * Pure TypeScript port of ParkRecommender.recommend().
 * All constants come from web/engine_data.json — nothing is hardcoded here.
 * Algorithm: docs/engine-contract.md.
 */

export type EngineData = {
  engine_version: string;
  content_hash: string;
  weights: {
    W_CONTENT: number;
    W_DAYS: number;
    W_DIFF: number;
    W_BUDGET: number;
    CROWD_PENALTY: number;
    W_MONTH_PENALTY: number;
    TIE_EPSILON: number;
    MONTH_DISTANCE_MAX: number;
    DRIVE_MPH: number;
    DRIVE_DETOUR: number;
    EARTH_RADIUS_MILES: number;
  };
  vocab: {
    biomes: string[];
    tags: string[];
    tag_idf: Record<string, number>;
  };
  ordinals: {
    days: Record<string, number>;
    difficulty: Record<string, number>;
    budget: Record<string, number>;
    crowd: Record<string, number>;
  };
  catalog: ParkRecord[];
};

export type ParkRecord = {
  park_code: string;
  name: string;
  states: string;
  biomes: string[];
  tags: string[];
  difficulty: string;
  days_needed: string;
  crowd: string;
  budget_tier: string;
  best_months: string[];
  remote: boolean;
  permit_likely: boolean;
  lat: number;
  lon: number;
  nps_url: string;
};

export type TripProfile = {
  biomes: string[];
  tags: string[];
  difficulty?: string;
  days_needed?: string;
  crowd_pref?: string;
  budget_tier?: string;
  month?: number | null;
  origin_lat?: number | null;
  origin_lon?: number | null;
  max_drive_hours?: number | null;
  allow_remote?: boolean;
  allow_permits?: boolean;
};

/** Thrown when an enum / month / drive field is illegal (never a silent NaN). */
export class InvalidProfileError extends Error {
  readonly field: string;
  readonly value: unknown;
  readonly allowed: unknown;

  constructor(field: string, value: unknown, allowed?: unknown) {
    const msg =
      allowed === undefined
        ? `Invalid ${field}=${repr(value)}`
        : `Invalid ${field}=${repr(value)}; allowed: ${formatAllowed(allowed)}`;
    super(msg);
    this.name = "InvalidProfileError";
    this.field = field;
    this.value = value;
    this.allowed = allowed;
  }
}

/** Match Python repr-ish quotes for strings; leave numbers/null bare. */
function repr(value: unknown): string {
  if (typeof value === "string") return `'${value}'`;
  return String(value);
}

function formatAllowed(allowed: unknown): string {
  if (Array.isArray(allowed)) {
    return `[${allowed.map((item) => repr(item)).join(", ")}]`;
  }
  return String(allowed);
}

function requireEnum(
  field: string,
  value: string,
  allowed: readonly string[],
): void {
  if (!allowed.includes(value)) {
    throw new InvalidProfileError(field, value, [...allowed]);
  }
}

/**
 * Validate enum / month / drive fields. Unknown biomes and tags are not
 * checked — scoring ignores them (contract §1).
 */
export function validateProfile(profile: RequiredProfile, data: EngineData): void {
  requireEnum("difficulty", profile.difficulty, Object.keys(data.ordinals.difficulty));
  requireEnum("days_needed", profile.days_needed, Object.keys(data.ordinals.days));
  requireEnum("crowd_pref", profile.crowd_pref, Object.keys(data.ordinals.crowd));
  requireEnum("budget_tier", profile.budget_tier, Object.keys(data.ordinals.budget));

  const month = profile.month;
  if (month !== null) {
    if (
      typeof month !== "number" ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      throw new InvalidProfileError("month", month, "null or integer 1-12");
    }
  }

  const maxHours = profile.max_drive_hours;
  if (maxHours !== null) {
    if (typeof maxHours !== "number" || !(maxHours > 0) || Number.isNaN(maxHours)) {
      throw new InvalidProfileError(
        "max_drive_hours",
        maxHours,
        "null or a positive number",
      );
    }
  }
}

export type Breakdown = {
  content: number;
  days: number;
  difficulty: number;
  budget: number;
  crowd_penalty: number;
  month_penalty: number;
  weighted: {
    content: number;
    days: number;
    difficulty: number;
    budget: number;
    crowd_penalty: number;
    month_penalty: number;
  };
};

export type ParkFacts = {
  park_code: string;
  name: string;
  states: string;
  biomes: string[];
  tags: string[];
  difficulty: string;
  days_needed: string;
  crowd: string;
  budget_tier: string;
  best_months: string[];
  remote: boolean;
  permit_likely: boolean;
  nps_url: string;
  why: string;
  drive_hours: number | null;
};

export type RankedPark = {
  rank: number;
  score: number;
  match_percent: number;
  tied_with_neighbors: boolean;
  breakdown: Breakdown;
  facts: ParkFacts;
};

export type RecommendResult = {
  engine_version: string;
  k: number;
  n_returned: number;
  empty: boolean;
  tie_epsilon: number;
  tie_groups: string[][];
  parks: RankedPark[];
};

function multiHot(values: string[], vocab: string[]): number[] {
  const index = new Map(vocab.map((name, i) => [name, i]));
  const vec = new Array(vocab.length).fill(0);
  for (const item of values) {
    const i = index.get(item);
    if (i !== undefined) vec[i] = 1;
  }
  return vec;
}

/** Biome multi-hot + IDF-weighted tag multi-hot (unnormalized). */
export function contentVector(
  biomes: string[],
  tags: string[],
  data: EngineData,
): number[] {
  const biomeVec = multiHot(biomes, data.vocab.biomes);
  const tagVec = multiHot(tags, data.vocab.tags);
  const weighted = tagVec.map((v, i) => {
    const tag = data.vocab.tags[i];
    return v * (data.vocab.tag_idf[tag] ?? 0);
  });
  return biomeVec.concat(weighted);
}

function l2Normalize(vec: number[]): number[] {
  let sumSq = 0;
  for (const v of vec) sumSq += v * v;
  const norm = Math.sqrt(sumSq);
  if (norm < 1e-12) return vec.slice();
  return vec.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const na = l2Normalize(a);
  const nb = l2Normalize(b);
  let dot = 0;
  for (let i = 0; i < na.length; i++) dot += na[i]! * nb[i]!;
  return dot;
}

/** 1 if identical, 0 if as far as the scale allows. */
export function closeness(
  parkLevel: number,
  userLevel: number,
  span: number,
): number {
  if (span <= 0) return 1;
  return 1 - Math.min(Math.abs(parkLevel - userLevel) / span, 1);
}

/** Min months from requested to nearest best month (Dec wraps to Jan). */
export function monthDistance(
  requested: number,
  bestMonths: string[],
): number {
  if (bestMonths.length === 0) return 6;
  let best = 6;
  const req = requested | 0;
  for (const token of bestMonths) {
    const other = Number.parseInt(token, 10);
    const delta = Math.abs(req - other) % 12;
    best = Math.min(best, Math.min(delta, 12 - delta));
  }
  return best;
}

/** Great-circle miles × detour / highway mph — same sketch as Python. */
export function driveHours(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  data: EngineData,
): number {
  const r = data.weights.EARTH_RADIUS_MILES;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const p1 = toRad(lat1);
  const p2 = toRad(lat2);
  const dphi = toRad(lat2 - lat1);
  const dlmb = toRad(lon2 - lon1);
  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dlmb / 2) ** 2;
  const miles = 2 * r * Math.asin(Math.sqrt(a));
  return (miles * data.weights.DRIVE_DETOUR) / data.weights.DRIVE_MPH;
}

export function matchPercent(score: number, data: EngineData): number {
  const maxScore =
    data.weights.W_CONTENT +
    data.weights.W_DAYS +
    data.weights.W_DIFF +
    data.weights.W_BUDGET;
  const pct = (score / maxScore) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function whyBlurb(
  park: ParkRecord,
  profile: RequiredProfile,
  driveHoursValue: number | null,
): string {
  const bits: string[] = [...park.biomes];
  const parkTags = new Set(park.tags);
  let added = 0;
  for (const tag of profile.tags) {
    if (parkTags.has(tag) && added < 3) {
      bits.push(tag);
      added += 1;
    }
  }
  if (profile.days_needed === park.days_needed) {
    bits.push(`${park.days_needed} day trip`);
  }
  if (park.crowd === "low") bits.push("low crowds");
  if (driveHoursValue !== null) {
    bits.push(`~${driveHoursValue.toFixed(1)}h drive`);
  }
  return bits.join(" · ");
}

type RequiredProfile = {
  biomes: string[];
  tags: string[];
  difficulty: string;
  days_needed: string;
  crowd_pref: string;
  budget_tier: string;
  month: number | null;
  origin_lat: number | null;
  origin_lon: number | null;
  max_drive_hours: number | null;
  allow_remote: boolean;
  allow_permits: boolean;
};

function normalizeProfile(profile: TripProfile): RequiredProfile {
  return {
    biomes: profile.biomes ?? [],
    tags: profile.tags ?? [],
    // null/undefined on enums = omit → documented default (parity with Python).
    difficulty: profile.difficulty ?? "easy",
    days_needed: profile.days_needed ?? "2-3",
    crowd_pref: profile.crowd_pref ?? "medium",
    budget_tier: profile.budget_tier ?? "mid",
    // month and max_drive_hours: null stays null ("no constraint"), never
    // replaced with a numeric default — validateProfile checks the real value.
    month: profile.month ?? null,
    origin_lat: profile.origin_lat ?? null,
    origin_lon: profile.origin_lon ?? null,
    max_drive_hours: profile.max_drive_hours ?? null,
    allow_remote: profile.allow_remote ?? true,
    allow_permits: profile.allow_permits ?? true,
  };
}

type Scored = {
  park: ParkRecord;
  score: number;
  content: number;
  days: number;
  difficulty: number;
  budget: number;
  crowd_penalty: number;
  month_penalty: number;
  drive_hours: number | null;
};

function annotateTies(
  ranked: Scored[],
  epsilon: number,
): { tied: boolean[]; tieGroups: string[][] } {
  const n = ranked.length;
  const tied = new Array(n).fill(false);
  const tieGroups: string[][] = [];
  if (n === 0) return { tied, tieGroups };

  let group = [ranked[0]!.park.park_code];
  for (let i = 1; i < n; i++) {
    if (Math.abs(ranked[i - 1]!.score - ranked[i]!.score) <= epsilon) {
      group.push(ranked[i]!.park.park_code);
      tied[i] = true;
      tied[i - 1] = true;
    } else {
      if (group.length > 1) tieGroups.push(group);
      group = [ranked[i]!.park.park_code];
    }
  }
  if (group.length > 1) tieGroups.push(group);
  return { tied, tieGroups };
}

/**
 * Rank parks for a trip profile using only `data` from web/engine_data.json.
 */
export function recommend(
  data: EngineData,
  profileInput: TripProfile,
  k = 5,
): RecommendResult {
  const profile = normalizeProfile(profileInput);
  validateProfile(profile, data);
  const w = data.weights;
  const userVec = contentVector(profile.biomes, profile.tags, data);
  const daysU = data.ordinals.days[profile.days_needed]!;
  const diffU = data.ordinals.difficulty[profile.difficulty]!;
  const budgetU = data.ordinals.budget[profile.budget_tier]!;
  const crowdU = data.ordinals.crowd[profile.crowd_pref]!;

  const useDrive =
    profile.origin_lat !== null &&
    profile.origin_lon !== null &&
    profile.max_drive_hours !== null;

  const candidates: Scored[] = [];
  for (const park of data.catalog) {
    if (!profile.allow_remote && park.remote) continue;
    if (!profile.allow_permits && park.permit_likely) continue;

    let drive: number | null = null;
    if (useDrive) {
      drive = driveHours(
        profile.origin_lat!,
        profile.origin_lon!,
        park.lat,
        park.lon,
        data,
      );
      if (drive > profile.max_drive_hours!) continue;
    }

    const content = cosineSimilarity(
      userVec,
      contentVector(park.biomes, park.tags, data),
    );
    const days = closeness(
      data.ordinals.days[park.days_needed]!,
      daysU,
      3.0,
    );
    const difficulty = closeness(
      data.ordinals.difficulty[park.difficulty]!,
      diffU,
      2.0,
    );
    const budget = closeness(
      data.ordinals.budget[park.budget_tier]!,
      budgetU,
      2.0,
    );
    const crowdGap = Math.max(
      0,
      data.ordinals.crowd[park.crowd]! - crowdU,
    );
    const crowd_penalty = crowdGap * w.CROWD_PENALTY;
    const month_penalty =
      profile.month === null
        ? 0
        : (monthDistance(profile.month, park.best_months) /
            w.MONTH_DISTANCE_MAX) *
          w.W_MONTH_PENALTY;
    const score =
      w.W_CONTENT * content +
      w.W_DAYS * days +
      w.W_DIFF * difficulty +
      w.W_BUDGET * budget -
      crowd_penalty -
      month_penalty;

    candidates.push({
      park,
      score,
      content,
      days,
      difficulty,
      budget,
      crowd_penalty,
      month_penalty,
      drive_hours: drive,
    });
  }

  // Score desc, then park_code asc — portable exact-tie break (contract §3).
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.park.park_code < b.park.park_code
      ? -1
      : a.park.park_code > b.park.park_code
        ? 1
        : 0;
  });

  const ranked = candidates.slice(0, k);
  const { tied, tieGroups } = annotateTies(ranked, w.TIE_EPSILON);

  const parks: RankedPark[] = ranked.map((row, i) => {
    const breakdown: Breakdown = {
      content: row.content,
      days: row.days,
      difficulty: row.difficulty,
      budget: row.budget,
      crowd_penalty: row.crowd_penalty,
      month_penalty: row.month_penalty,
      weighted: {
        content: w.W_CONTENT * row.content,
        days: w.W_DAYS * row.days,
        difficulty: w.W_DIFF * row.difficulty,
        budget: w.W_BUDGET * row.budget,
        crowd_penalty: -row.crowd_penalty,
        month_penalty: -row.month_penalty,
      },
    };
    return {
      rank: i + 1,
      score: row.score,
      match_percent: matchPercent(row.score, data),
      tied_with_neighbors: tied[i]!,
      breakdown,
      facts: {
        park_code: row.park.park_code,
        name: row.park.name,
        states: row.park.states,
        biomes: [...row.park.biomes],
        tags: [...row.park.tags],
        difficulty: row.park.difficulty,
        days_needed: row.park.days_needed,
        crowd: row.park.crowd,
        budget_tier: row.park.budget_tier,
        best_months: [...row.park.best_months],
        remote: row.park.remote,
        permit_likely: row.park.permit_likely,
        nps_url: row.park.nps_url,
        why: whyBlurb(row.park, profile, row.drive_hours),
        drive_hours: row.drive_hours,
      },
    };
  });

  return {
    engine_version: data.engine_version,
    k,
    n_returned: parks.length,
    empty: parks.length === 0,
    tie_epsilon: w.TIE_EPSILON,
    tie_groups: tieGroups,
    parks,
  };
}
