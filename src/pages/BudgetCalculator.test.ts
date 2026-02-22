/**
 * Unit tests for the budget calculator pricing logic.
 *
 * We replicate the exported constants and calculation logic from
 * BudgetCalculator.tsx to validate that destination-specific cost
 * multipliers and origin→destination flight multipliers produce
 * different results for different inputs.
 */
import { describe, it, expect } from "vitest";

// Replicate the constants from BudgetCalculator.tsx
type ComfortLevel = "budget" | "mid" | "premium";

const ranges: Record<ComfortLevel, {
  flights: [number, number];
  accommodation: [number, number];
  food: [number, number];
  activities: number;
}> = {
  budget:  { flights: [300, 500],  accommodation: [15, 30],   food: [10, 20],  activities: 50 },
  mid:     { flights: [500, 800],  accommodation: [50, 100],  food: [30, 50],  activities: 150 },
  premium: { flights: [800, 1200], accommodation: [150, 300], food: [60, 100], activities: 400 },
};

const gearEstimate: [number, number] = [100, 300];
const insuranceEstimate: [number, number] = [30, 80];

const destinationCostMultiplier: Record<string, number> = {
  "Estados Unidos": 1.3,
  "Chile": 0.9,
  "Argentina": 0.7,
  "Perú": 0.65,
  "Colombia": 0.6,
  "México": 0.7,
  "España": 1.1,
  "Nepal": 0.5,
};

const flightMultiplier: Record<string, Record<string, number>> = {
  "México": {
    "México": 0.4, "Estados Unidos": 0.6, "Chile": 1.1, "Nepal": 1.6,
  },
  "España": {
    "España": 0.3, "Nepal": 1.0, "México": 1.2, "Chile": 1.3,
  },
  "USA": {
    "Estados Unidos": 0.4, "México": 0.5, "Chile": 1.1, "Nepal": 1.4,
  },
};

function calculateBreakdown(
  comfort: ComfortLevel,
  days: number,
  destCountry: string,
  origin: string
) {
  const r = ranges[comfort];
  const costMult = destinationCostMultiplier[destCountry] ?? 1.0;
  const flightMult = (origin && destCountry) ? (flightMultiplier[origin]?.[destCountry] ?? 1.0) : 1.0;

  const flightsLow = Math.round(r.flights[0] * flightMult);
  const flightsHigh = Math.round(r.flights[1] * flightMult);
  const accomLow = Math.round(r.accommodation[0] * costMult) * days;
  const accomHigh = Math.round(r.accommodation[1] * costMult) * days;
  const foodLow = Math.round(r.food[0] * costMult) * days;
  const foodHigh = Math.round(r.food[1] * costMult) * days;
  const activities = Math.round(r.activities * costMult);

  const totalLow = flightsLow + accomLow + foodLow + activities + gearEstimate[0] + insuranceEstimate[0];
  const totalHigh = flightsHigh + accomHigh + foodHigh + activities + gearEstimate[1] + insuranceEstimate[1];

  return { flightsLow, flightsHigh, accomLow, accomHigh, foodLow, foodHigh, activities, totalLow, totalHigh };
}

// ---- Tests ----

describe("Destination cost multiplier", () => {
  it("US destination costs more than Nepal for same comfort and days", () => {
    const us = calculateBreakdown("mid", 7, "Estados Unidos", "México");
    const nepal = calculateBreakdown("mid", 7, "Nepal", "México");
    // Accommodation + food should be higher in US (1.3) vs Nepal (0.5)
    expect(us.accomLow).toBeGreaterThan(nepal.accomLow);
    expect(us.foodLow).toBeGreaterThan(nepal.foodLow);
  });

  it("different destinations produce different totals", () => {
    const chile = calculateBreakdown("budget", 5, "Chile", "México");
    const usa = calculateBreakdown("budget", 5, "Estados Unidos", "México");
    expect(chile.totalLow).not.toBe(usa.totalLow);
  });

  it("unknown destination country defaults to 1.0 multiplier", () => {
    const unknown = calculateBreakdown("mid", 5, "UnknownLand", "México");
    const r = ranges.mid;
    // With costMult = 1.0, accommodation per night should be unchanged
    expect(unknown.accomLow).toBe(r.accommodation[0] * 5);
    expect(unknown.accomHigh).toBe(r.accommodation[1] * 5);
  });
});

describe("Flight cost by origin→destination", () => {
  it("México→México flights cheaper than México→Nepal", () => {
    const domestic = calculateBreakdown("mid", 5, "México", "México");
    const farAway = calculateBreakdown("mid", 5, "Nepal", "México");
    expect(domestic.flightsLow).toBeLessThan(farAway.flightsLow);
    expect(domestic.flightsHigh).toBeLessThan(farAway.flightsHigh);
  });

  it("España→España flights cheaper than España→Chile", () => {
    const domestic = calculateBreakdown("mid", 5, "España", "España");
    const farAway = calculateBreakdown("mid", 5, "Chile", "España");
    expect(domestic.flightsLow).toBeLessThan(farAway.flightsLow);
  });

  it("no origin selected defaults to 1.0 flight multiplier", () => {
    const noOrigin = calculateBreakdown("mid", 5, "Chile", "");
    const r = ranges.mid;
    expect(noOrigin.flightsLow).toBe(r.flights[0]);
    expect(noOrigin.flightsHigh).toBe(r.flights[1]);
  });

  it("unknown origin defaults to 1.0 flight multiplier", () => {
    const unknown = calculateBreakdown("mid", 5, "Chile", "UnknownOrigin");
    const r = ranges.mid;
    expect(unknown.flightsLow).toBe(r.flights[0]);
    expect(unknown.flightsHigh).toBe(r.flights[1]);
  });
});

describe("Comfort levels produce different totals", () => {
  it("premium > mid > budget for same destination and days", () => {
    const budget = calculateBreakdown("budget", 7, "Chile", "México");
    const mid = calculateBreakdown("mid", 7, "Chile", "México");
    const premium = calculateBreakdown("premium", 7, "Chile", "México");
    expect(premium.totalHigh).toBeGreaterThan(mid.totalHigh);
    expect(mid.totalHigh).toBeGreaterThan(budget.totalHigh);
  });
});

describe("Days multiplier", () => {
  it("more days = higher accommodation and food costs", () => {
    const short = calculateBreakdown("mid", 3, "España", "México");
    const long = calculateBreakdown("mid", 10, "España", "México");
    expect(long.accomLow).toBeGreaterThan(short.accomLow);
    expect(long.foodLow).toBeGreaterThan(short.foodLow);
  });

  it("flights stay the same regardless of days", () => {
    const short = calculateBreakdown("mid", 3, "España", "México");
    const long = calculateBreakdown("mid", 10, "España", "México");
    expect(short.flightsLow).toBe(long.flightsLow);
    expect(short.flightsHigh).toBe(long.flightsHigh);
  });
});
