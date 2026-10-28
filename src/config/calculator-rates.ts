/**
 * Estimados de la calculadora de presupuesto (/calculadora).
 * Toda cifra es un estimado de mercado salvo la entrada al parque
 * (dato oficial NPS desde destinations.entrance_fee_usd).
 *
 * Revisar gasolina mensualmente (AAA). RATES_UPDATED marca la última revisión.
 */

export const RATES_UPDATED = "2026-10-27";

export const CALCULATOR_RATES = {
  // FRANK: replace with gasprices.aaa.com before merge
  GAS_PRICE_CA: 4.8,
  // FRANK: replace with gasprices.aaa.com before merge
  GAS_PRICE_US: 3.2,
  MPG: 28,
  CAR_RENTAL_PER_DAY: 60,
  /** mph used to convert drive hours → round-trip miles (hours × 65 × 2). */
  DRIVE_MPH: 65,
  /** People per car for entrance + gas / rental car counts. */
  PEOPLE_PER_CAR: 5,
  /** Camping sites (Mochilero). */
  PEOPLE_PER_CAMPSITE: 6,
  /** Hotel rooms (Cómodo / Premium). */
  PEOPLE_PER_HOTEL_ROOM: 4,
  /** Default transport flips to flying at or above this drive time (hours). */
  DRIVE_FLY_THRESHOLD_HOURS: 10,
  LODGING_PER_NIGHT: {
    budget: 30,
    mid: 150,
    premium: 300,
  },
  FOOD_PER_PERSON_DAY: {
    budget: 25,
    mid: 45,
    premium: 80,
  },
  GEAR_BY_STYLE: {
    budget: 250,
    mid: 100,
    premium: 100,
  },
} as const;

export type CalculatorRates = typeof CALCULATOR_RATES;
