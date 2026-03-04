/**
 * Unit tests for the budget calculator pricing logic.
 *
 * These tests validate the `calculateBudget` function imported from
 * `@/lib/budget-calc`, which uses real Supabase data (estimated_budget_usd)
 * and a simplified comfort multiplier model.
 */
import { describe, it, expect } from "vitest";
import { calculateBudget, comfortMultipliers, GEAR_ESTIMATE, INSURANCE_ESTIMATE } from "@/lib/budget-calc";

describe("calculateBudget", () => {
  it("uses estimated_budget_usd / 5 as base cost per day", () => {
    const result = calculateBudget(500, "budget", 5, 0);
    // baseCostPerDay = 500/5 = 100, budget multiplier = 1, landCost = 100*1*5 = 500
    const landCost = 500;
    expect(result.accommodation + result.food + result.activities).toBe(landCost);
    expect(result.total).toBe(landCost + 0 + GEAR_ESTIMATE + INSURANCE_ESTIMATE);
  });

  it("falls back to 500 when estimated_budget_usd is null", () => {
    const result = calculateBudget(null, "budget", 5, 0);
    // baseCostPerDay = 500/5 = 100, landCost = 100*1*5 = 500
    expect(result.accommodation + result.food + result.activities).toBe(500);
  });

  it("applies comfort multipliers correctly", () => {
    const budget = calculateBudget(500, "budget", 5, 0);
    const mid = calculateBudget(500, "mid", 5, 0);
    const premium = calculateBudget(500, "premium", 5, 0);

    const landBudget = budget.accommodation + budget.food + budget.activities;
    const landMid = mid.accommodation + mid.food + mid.activities;
    const landPremium = premium.accommodation + premium.food + premium.activities;

    expect(landMid).toBeGreaterThan(landBudget);
    expect(landPremium).toBeGreaterThan(landMid);
    // Check exact multiplier ratios
    expect(landMid / landBudget).toBeCloseTo(comfortMultipliers.mid / comfortMultipliers.budget, 1);
    expect(landPremium / landBudget).toBeCloseTo(comfortMultipliers.premium / comfortMultipliers.budget, 1);
  });

  it("scales linearly with days", () => {
    const short = calculateBudget(500, "mid", 3, 0);
    const long = calculateBudget(500, "mid", 10, 0);
    const landShort = short.accommodation + short.food + short.activities;
    const landLong = long.accommodation + long.food + long.activities;
    expect(landLong / landShort).toBeCloseTo(10 / 3, 1);
  });

  it("includes flightCost exactly as entered", () => {
    const noFlight = calculateBudget(500, "mid", 5, 0);
    const withFlight = calculateBudget(500, "mid", 5, 350);
    expect(withFlight.flights).toBe(350);
    expect(noFlight.flights).toBe(0);
    expect(withFlight.total - noFlight.total).toBe(350);
  });

  it("distributes land cost as 40% accommodation, 30% food, ~30% activities", () => {
    const result = calculateBudget(1000, "budget", 5, 0);
    // baseCostPerDay = 1000/5 = 200, landCost = 200*1*5 = 1000
    expect(result.accommodation).toBe(Math.round(1000 * 0.4));
    expect(result.food).toBe(Math.round(1000 * 0.3));
    // activities gets remainder to avoid rounding drift
    expect(result.activities).toBe(1000 - result.accommodation - result.food);
  });

  it("adds gear and insurance as fixed estimates", () => {
    const result = calculateBudget(500, "mid", 5, 100);
    expect(result.gear).toBe(GEAR_ESTIMATE);
    expect(result.insurance).toBe(INSURANCE_ESTIMATE);
  });

  it("total = landCost + flights + gear + insurance", () => {
    const result = calculateBudget(750, "premium", 7, 400);
    const landCost = result.accommodation + result.food + result.activities;
    expect(result.total).toBe(landCost + result.flights + GEAR_ESTIMATE + INSURANCE_ESTIMATE);
  });
});