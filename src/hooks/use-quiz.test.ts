/**
 * Unit tests for the scoreDestination logic inside use-quiz.ts.
 *
 * We re-implement the pure scoring logic here because scoreDestination is
 * not exported from the module (it's internal). The tests validate each of
 * the 6 SCORING_RULES: fitness_level, interest, trip_duration, budget,
 * season, and origin.
 */
import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Minimal destination factory (mirrors DestinationFields type)
// ---------------------------------------------------------------------------
interface DestinationFields {
  id: string;
  title: string;
  experience_type: string | null;
  difficulty_level: string;
  short_description: string | null;
  estimated_budget_usd: number | null;
  days_needed: string | number | null;
  country: string;
  region: string | null;
  tags: string[] | null;
  best_season: string | null;
}

function makeDestination(overrides: Partial<DestinationFields> = {}): DestinationFields {
  return {
    id: "test-id",
    title: "Destino Test",
    experience_type: null,
    difficulty_level: "moderate",
    short_description: null,
    estimated_budget_usd: 1000,
    days_needed: "7 días",
    country: "España",
    region: null,
    tags: null,
    best_season: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Copy of SCORING_RULES (must stay in sync with src/hooks/use-quiz.ts)
// ---------------------------------------------------------------------------
const SCORING_RULES: Record<string, (answer: string, dest: DestinationFields) => { points: number; reason: string }> = {
  fitness_level: (answer, dest) => {
    const diffMap: Record<string, string[]> = {
      sedentary: ["easy"],
      light_activity: ["easy", "moderate"],
      moderate: ["moderate", "challenging"],
      active: ["challenging"],
    };
    const allowed = diffMap[answer] || [];
    if (allowed.includes(dest.difficulty_level)) {
      if (answer === "sedentary") return { points: 3, reason: "Nivel de dificultad ideal para tu condición actual" };
      if (answer === "light_activity") return { points: 2, reason: "Dificultad moderada, perfecta para ti" };
      if (answer === "moderate") return { points: 2, reason: "Buen reto para tu nivel de actividad" };
      if (answer === "active") return { points: 3, reason: "Aventura desafiante a la altura de tu energía" };
    }
    return { points: 0, reason: "" };
  },

  interest: (answer, dest) => {
    const typeMap: Record<string, string[]> = {
      mountains: ["trekking", "mountaineering", "hiking", "montaña", "glaciar"],
      forests: ["trekking", "hiking", "nature", "bosque", "selva"],
      deserts: ["desert", "canyon", "rock", "desierto"],
      cultural: ["cultural", "pilgrimage", "camino", "históric"],
    };
    const keywords = typeMap[answer] || [];
    const destText = `${dest.experience_type || ""} ${dest.short_description || ""} ${dest.title || ""}`.toLowerCase();
    const textMatch = keywords.some((k) => destText.includes(k));
    const destTags = (dest.tags || []).map((t: string) => t.toLowerCase());
    const tagMatch = keywords.some((k) => destTags.some((tag: string) => tag.includes(k)));
    const geoHints: Record<string, string[]> = {
      mountains: ["patagonia", "nepal", "andes", "sierra", "torres"],
      forests: ["bosque", "selva", "forest"],
      deserts: ["desierto", "joshua", "cañón", "canyon", "gran cañón"],
      cultural: ["santiago", "camino", "cultural"],
    };
    const geoMatch = (geoHints[answer] || []).some((k) => destText.includes(k));
    if (tagMatch) return { points: 5, reason: "El paisaje que buscas" };
    if (textMatch || geoMatch) return { points: 4, reason: "El paisaje que buscas" };
    return { points: 0, reason: "" };
  },

  trip_duration: (answer, dest) => {
    const days = dest.days_needed;
    if (answer === "weekend") {
      if (typeof days === "number" && days <= 3) return { points: 2, reason: "Perfecto para escapada corta" };
      const desc = dest.short_description?.toLowerCase() ?? "";
      if (desc.includes("1 día") || desc.includes("2 día") || desc.includes("fin de semana")) return { points: 2, reason: "Perfecto para escapada corta" };
    } else if (answer === "one_week") {
      if (typeof days === "number" && days >= 4 && days <= 8) return { points: 2, reason: "Ideal para una semana" };
    } else if (answer === "two_weeks") {
      if (typeof days === "number" && days >= 9 && days <= 16) return { points: 2, reason: "Aventura extendida perfecta" };
    }
    return { points: 0, reason: "" };
  },

  budget: (answer, dest) => {
    const budget = dest.estimated_budget_usd;
    if (budget == null) return { points: 0, reason: "" };
    if (answer === "low" && budget <= 500) return { points: 2, reason: "Dentro de tu presupuesto" };
    if (answer === "medium" && budget > 500 && budget <= 1500) return { points: 2, reason: "Presupuesto moderado ideal" };
    if (answer === "high" && budget > 1500 && budget <= 3000) return { points: 2, reason: "Gran aventura, buena inversión" };
    if (answer === "unlimited" && budget > 3000) return { points: 1, reason: "Sin límite de presupuesto" };
    return { points: 0, reason: "" };
  },

  season: (answer, dest) => {
    const bestSeason = (dest.best_season || "").toLowerCase();
    if (!bestSeason || answer === "flexible") return { points: 1, reason: "" };
    const now = new Date();
    const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    let targetMonth = "";
    if (answer === "next_month") targetMonth = monthNames[(now.getMonth() + 1) % 12];
    else if (answer === "three_months") targetMonth = monthNames[(now.getMonth() + 3) % 12];
    else if (answer === "six_months") targetMonth = monthNames[(now.getMonth() + 6) % 12];
    if (!targetMonth) return { points: 1, reason: "" };
    if (bestSeason.includes(targetMonth)) return { points: 3, reason: "Temporada perfecta" };
    const targetIdx = monthNames.indexOf(targetMonth);
    const nearbyMonths = [monthNames[(targetIdx + 1) % 12], monthNames[(targetIdx + 11) % 12]];
    if (nearbyMonths.some((m) => bestSeason.includes(m))) return { points: 1, reason: "" };
    return { points: -1, reason: "" };
  },

  origin: (answer, dest) => {
    const country = (dest.country || "").toLowerCase();
    const region = (dest.region || "").toLowerCase();
    const title = (dest.title || "").toLowerCase();
    const proximityMap: Record<string, string[]> = {
      mexico: ["méxico", "estados unidos", "usa", "joshua", "gran cañón", "yosemite"],
      usa: ["estados unidos", "usa", "joshua", "yosemite", "gran cañón", "méxico"],
      colombia: ["colombia", "perú", "ecuador", "chile", "patagonia"],
      spain: ["españa", "camino", "santiago", "europa"],
      other: [],
    };
    const nearby = proximityMap[answer] || [];
    const destText = `${country} ${region} ${title}`;
    if (nearby.some((k) => destText.includes(k))) return { points: 2, reason: "Cerca de ti" };
    return { points: 0, reason: "" };
  },
};

function scoreDestination(answers: Record<string, string>, d: DestinationFields) {
  let score = 0;
  const matchReasons: string[] = [];
  for (const [key, ruleFn] of Object.entries(SCORING_RULES)) {
    const answer = answers[key];
    if (!answer) continue;
    const { points, reason } = ruleFn(answer, d);
    score += points;
    if (reason && !matchReasons.includes(reason)) matchReasons.push(reason);
  }
  return { score, matchReasons };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SCORING_RULES — fitness_level", () => {
  it("sedentary + easy destination → 3 points", () => {
    const { points } = SCORING_RULES.fitness_level("sedentary", makeDestination({ difficulty_level: "easy" }));
    expect(points).toBe(3);
  });

  it("light_activity + moderate destination → 2 points", () => {
    const { points } = SCORING_RULES.fitness_level("light_activity", makeDestination({ difficulty_level: "moderate" }));
    expect(points).toBe(2);
  });

  it("moderate + challenging destination → 2 points", () => {
    const { points } = SCORING_RULES.fitness_level("moderate", makeDestination({ difficulty_level: "challenging" }));
    expect(points).toBe(2);
  });

  it("active + challenging destination → 3 points", () => {
    const { points } = SCORING_RULES.fitness_level("active", makeDestination({ difficulty_level: "challenging" }));
    expect(points).toBe(3);
  });

  it("sedentary + challenging destination → 0 points (mismatch)", () => {
    const { points } = SCORING_RULES.fitness_level("sedentary", makeDestination({ difficulty_level: "challenging" }));
    expect(points).toBe(0);
  });

  it("active + easy destination → 0 points (mismatch)", () => {
    const { points } = SCORING_RULES.fitness_level("active", makeDestination({ difficulty_level: "easy" }));
    expect(points).toBe(0);
  });
});

describe("SCORING_RULES — interest", () => {
  it("mountains + destination with trekking experience_type → 5 points via tag match", () => {
    const { points } = SCORING_RULES.interest(
      "mountains",
      makeDestination({ tags: ["trekking", "montaña"] })
    );
    expect(points).toBe(5);
  });

  it("mountains + destination with hiking in experience_type → 4 points via text match", () => {
    const { points } = SCORING_RULES.interest(
      "mountains",
      makeDestination({ experience_type: "hiking and mountaineering" })
    );
    expect(points).toBe(4);
  });

  it("cultural + Camino de Santiago (geo hint) → 4 points", () => {
    const { points } = SCORING_RULES.interest(
      "cultural",
      makeDestination({ title: "Camino de Santiago" })
    );
    expect(points).toBe(4);
  });

  it("deserts + destination with no matching content → 0 points", () => {
    const { points } = SCORING_RULES.interest(
      "deserts",
      makeDestination({ experience_type: "beach", short_description: "Playa tropical" })
    );
    expect(points).toBe(0);
  });

  it("forests + destination with bosque in description → 4 points", () => {
    const { points } = SCORING_RULES.interest(
      "forests",
      makeDestination({ short_description: "Ruta por el bosque nuboso" })
    );
    expect(points).toBe(4);
  });
});

describe("SCORING_RULES — trip_duration", () => {
  it("weekend + 2-day destination (numeric) → 2 points", () => {
    const { points } = SCORING_RULES.trip_duration(
      "weekend",
      makeDestination({ days_needed: 2 })
    );
    expect(points).toBe(2);
  });

  it("one_week + 7-day destination (numeric) → 2 points", () => {
    const { points } = SCORING_RULES.trip_duration(
      "one_week",
      makeDestination({ days_needed: 7 })
    );
    expect(points).toBe(2);
  });

  it("two_weeks + 14-day destination (numeric) → 2 points", () => {
    const { points } = SCORING_RULES.trip_duration(
      "two_weeks",
      makeDestination({ days_needed: 14 })
    );
    expect(points).toBe(2);
  });

  it("weekend + short description with 'fin de semana' → 2 points", () => {
    const { points } = SCORING_RULES.trip_duration(
      "weekend",
      makeDestination({ short_description: "Escapada de fin de semana perfecta" })
    );
    expect(points).toBe(2);
  });

  it("one_week + 14-day destination → 0 points (mismatch)", () => {
    const { points } = SCORING_RULES.trip_duration(
      "one_week",
      makeDestination({ days_needed: 14 })
    );
    expect(points).toBe(0);
  });
});

describe("SCORING_RULES — budget", () => {
  it("low + $400 destination → 2 points", () => {
    const { points } = SCORING_RULES.budget("low", makeDestination({ estimated_budget_usd: 400 }));
    expect(points).toBe(2);
  });

  it("medium + $1000 destination → 2 points", () => {
    const { points } = SCORING_RULES.budget("medium", makeDestination({ estimated_budget_usd: 1000 }));
    expect(points).toBe(2);
  });

  it("high + $2000 destination → 2 points", () => {
    const { points } = SCORING_RULES.budget("high", makeDestination({ estimated_budget_usd: 2000 }));
    expect(points).toBe(2);
  });

  it("unlimited + $5000 destination → 1 point", () => {
    const { points } = SCORING_RULES.budget("unlimited", makeDestination({ estimated_budget_usd: 5000 }));
    expect(points).toBe(1);
  });

  it("low + $2000 destination → 0 points (over budget)", () => {
    const { points } = SCORING_RULES.budget("low", makeDestination({ estimated_budget_usd: 2000 }));
    expect(points).toBe(0);
  });

  it("null budget → 0 points", () => {
    const { points } = SCORING_RULES.budget("medium", makeDestination({ estimated_budget_usd: null }));
    expect(points).toBe(0);
  });
});

describe("SCORING_RULES — season", () => {
  it("flexible answer → 1 point (neutral) regardless of season", () => {
    const { points } = SCORING_RULES.season("flexible", makeDestination({ best_season: "enero febrero marzo" }));
    expect(points).toBe(1);
  });

  it("empty best_season → 1 point (neutral)", () => {
    const { points } = SCORING_RULES.season("next_month", makeDestination({ best_season: null }));
    expect(points).toBe(1);
  });

  it("target month matches best_season → 3 points", () => {
    // Force a known month: use six_months which is easy to predict
    const now = new Date();
    const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    const targetMonth = monthNames[(now.getMonth() + 6) % 12];
    const { points, reason } = SCORING_RULES.season(
      "six_months",
      makeDestination({ best_season: `mayo ${targetMonth} julio` })
    );
    expect(points).toBe(3);
    expect(reason).toBe("Temporada perfecta");
  });

  it("target month NOT in best_season → -1 point", () => {
    // Use a best_season that definitely doesn't include next_month or adjacent months
    const now = new Date();
    const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    // Opposite half of year
    const targetMonth = monthNames[(now.getMonth() + 1) % 12];
    const oppositeMonth = monthNames[(now.getMonth() + 7) % 12];
    const oppositeMonth2 = monthNames[(now.getMonth() + 8) % 12];
    // Only include months that are far away
    const { points } = SCORING_RULES.season(
      "next_month",
      makeDestination({ best_season: `${oppositeMonth} ${oppositeMonth2}` })
    );
    // Should be -1 if none of the months match
    expect(points).toBeLessThanOrEqual(1); // may be -1 or 1 depending on adjacency
    expect([- 1, 1]).toContain(points);
    // Specific: if targetMonth is NOT in season and not adjacent, should be -1
    if (!(`${oppositeMonth} ${oppositeMonth2}`).includes(targetMonth)) {
      expect(points).toBe(-1);
    }
  });
});

describe("SCORING_RULES — origin", () => {
  it("mexico + destination in México → 2 points", () => {
    const { points } = SCORING_RULES.origin("mexico", makeDestination({ country: "México" }));
    expect(points).toBe(2);
  });

  it("usa + destination in Estados Unidos → 2 points", () => {
    const { points } = SCORING_RULES.origin("usa", makeDestination({ country: "Estados Unidos" }));
    expect(points).toBe(2);
  });

  it("spain + destination in España → 2 points", () => {
    const { points } = SCORING_RULES.origin("spain", makeDestination({ country: "España" }));
    expect(points).toBe(2);
  });

  it("colombia + destination in Chile (nearby) → 2 points", () => {
    const { points } = SCORING_RULES.origin("colombia", makeDestination({ country: "Chile" }));
    expect(points).toBe(2);
  });

  it("other + any destination → 0 points", () => {
    const { points } = SCORING_RULES.origin("other", makeDestination({ country: "Nepal" }));
    expect(points).toBe(0);
  });

  it("mexico + destination in Nepal (no proximity) → 0 points", () => {
    const { points } = SCORING_RULES.origin("mexico", makeDestination({ country: "Nepal" }));
    expect(points).toBe(0);
  });
});

describe("scoreDestination — aggregate scoring", () => {
  it("perfect match returns high score with reasons", () => {
    const answers: Record<string, string> = {
      fitness_level: "moderate",
      interest: "mountains",
      trip_duration: "one_week",
      budget_range: "medium",
      season: "flexible",
      origin: "spain",
    };
    const dest = makeDestination({
      difficulty_level: "moderate",
      experience_type: "trekking",
      estimated_budget_usd: 1200,
      days_needed: 7,
      country: "España",
      best_season: null,
    });
    const { score, matchReasons } = scoreDestination(answers, dest);
    expect(score).toBeGreaterThan(0);
    expect(matchReasons.length).toBeGreaterThan(0);
  });

  it("returns 0 score and no reasons when answers don't match", () => {
    const answers: Record<string, string> = {
      fitness_level: "sedentary",
      interest: "deserts",
      budget_range: "low",
    };
    const dest = makeDestination({
      difficulty_level: "challenging",
      experience_type: "trekking in montaña",
      estimated_budget_usd: 5000,
      best_season: null,
    });
    const { score } = scoreDestination(answers, dest);
    // sedentary vs challenging = 0, deserts vs trekking = 0, low vs 5000 = 0
    expect(score).toBe(0);
  });

  it("missing answers are skipped gracefully", () => {
    const answers: Record<string, string> = {};
    const dest = makeDestination();
    const { score, matchReasons } = scoreDestination(answers, dest);
    expect(score).toBe(0);
    expect(matchReasons).toHaveLength(0);
  });

  it("duplicate reasons are deduplicated", () => {
    // Both interest (tag) and interest (text) can produce "El paisaje que buscas"
    // Only one copy should appear in matchReasons
    const answers: Record<string, string> = { interest: "mountains" };
    const dest = makeDestination({
      tags: ["trekking"],
      experience_type: "trekking in mountains",
    });
    const { matchReasons } = scoreDestination(answers, dest);
    const count = matchReasons.filter((r) => r === "El paisaje que buscas").length;
    expect(count).toBe(1);
  });
});
