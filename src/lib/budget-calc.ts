export type ComfortLevel = "budget" | "mid" | "premium";

export const comfortMultipliers: Record<ComfortLevel, number> = {
  budget: 1,
  mid: 1.8,
  premium: 3,
};

export const GEAR_ESTIMATE = 150;
export const INSURANCE_ESTIMATE = 50;

export function calculateBudget(
  estimatedBudgetUsd: number | null,
  comfort: ComfortLevel,
  days: number,
  flightCost: number,
) {
  const baseCostPerDay = (estimatedBudgetUsd || 500) / 5;
  const comfortMult = comfortMultipliers[comfort];
  const landCost = Math.round(baseCostPerDay * comfortMult * days);
  const flights = Math.round(flightCost);
  const gear = GEAR_ESTIMATE;
  const insurance = INSURANCE_ESTIMATE;

  const accommodation = Math.round(landCost * 0.4);
  const food = Math.round(landCost * 0.3);
  const activities = landCost - accommodation - food;

  const total = landCost + flights + gear + insurance;

  return { flights, accommodation, food, activities, gear, insurance, total };
}
