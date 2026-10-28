import { CALCULATOR_RATES } from "@/config/calculator-rates";

export type ComfortLevel = "budget" | "mid" | "premium";
export type TransportMode = "driving" | "flying";

export const STYLE_LABELS: Record<ComfortLevel, string> = {
  budget: "Mochilero",
  mid: "Cómodo",
  premium: "Premium",
};

export const STYLE_FROM_LABEL: Record<string, ComfortLevel> = {
  Mochilero: "budget",
  Cómodo: "mid",
  Premium: "premium",
};

const NO_ROAD_MESSAGE =
  "Este parque no tiene acceso por carretera. El traslado final (ferry o avioneta) lo cotizamos en tu itinerario.";

export interface TransportChoice {
  mode: TransportMode;
  /** True when driveFromOrigin() is null — UI must lock to Volando. */
  forcedFlying: boolean;
  message: string | null;
}

/**
 * Default transport for a park given drive hours from the origin.
 * null hours = no road access → force flying with the ferry/avioneta note.
 * Under 10 h → Manejando; otherwise Volando.
 */
export function resolveTransport(driveHours: number | null): TransportChoice {
  if (driveHours === null) {
    return { mode: "flying", forcedFlying: true, message: NO_ROAD_MESSAGE };
  }
  if (driveHours < CALCULATOR_RATES.DRIVE_FLY_THRESHOLD_HOURS) {
    return { mode: "driving", forcedFlying: false, message: null };
  }
  return { mode: "flying", forcedFlying: false, message: null };
}

/** CA gas price for ZIP prefixes 900–961 (inclusive); US price otherwise. */
export function gasPriceForZip(zip: string): number {
  const prefix = Number(zip.slice(0, 3));
  if (Number.isFinite(prefix) && prefix >= 900 && prefix <= 961) {
    return CALCULATOR_RATES.GAS_PRICE_CA;
  }
  return CALCULATOR_RATES.GAS_PRICE_US;
}

export function carsNeeded(people: number): number {
  return Math.ceil(people / CALCULATOR_RATES.PEOPLE_PER_CAR);
}

export function lodgingUnits(people: number, style: ComfortLevel): number {
  if (style === "budget") {
    return Math.ceil(people / CALCULATOR_RATES.PEOPLE_PER_CAMPSITE);
  }
  return Math.ceil(people / CALCULATOR_RATES.PEOPLE_PER_HOTEL_ROOM);
}

export function nightsForTrip(days: number): number {
  return Math.max(days - 1, 1);
}

export interface BudgetCalcInput {
  people: number;
  days: number;
  style: ComfortLevel;
  transport: TransportMode;
  /** Hours from driveFromOrigin(); null = no road (must fly). */
  driveHours: number | null;
  zip: string;
  entranceFeeUsd: number | null | undefined;
  /**
   * USD per person. null/undefined = "Por definir" (excluded from total).
   * Negatives are rejected.
   */
  flightPricePerPerson?: number | null;
  /** When true, gear line is omitted. */
  hasGear: boolean;
}

export interface BudgetLine {
  id: "gas" | "flights" | "car_rental" | "entrance" | "lodging" | "food" | "gear";
  label: string;
  amount: number;
  /** Shown even when amount is 0 (Entrada → "Gratis"). */
  alwaysShow?: boolean;
  /** Leave out of the total (empty flight price). */
  excludeFromTotal?: boolean;
  /** Display "Por definir" / "Gratis" instead of $0. */
  displayAmount?: string;
  subtext?: string;
  tag?: string;
}

export interface BudgetCalcResult {
  lines: BudgetLine[];
  total: number;
  perPerson: number;
  people: number;
  days: number;
  style: ComfortLevel;
  cars: number;
  lodgingUnits: number;
  nights: number;
  flightsPending: boolean;
  forcedFlying: boolean;
}

export function calculateBudget(input: BudgetCalcInput): BudgetCalcResult {
  const {
    people,
    days,
    style,
    transport: requestedTransport,
    driveHours,
    zip,
    entranceFeeUsd,
    flightPricePerPerson,
    hasGear,
  } = input;

  if (
    flightPricePerPerson != null &&
    Number.isFinite(flightPricePerPerson) &&
    flightPricePerPerson < 0
  ) {
    throw new RangeError("El precio del vuelo no puede ser negativo");
  }

  const transportChoice = resolveTransport(driveHours);
  const transport: TransportMode = transportChoice.forcedFlying
    ? "flying"
    : requestedTransport;

  const cars = carsNeeded(people);
  const nights = nightsForTrip(days);
  const units = lodgingUnits(people, style);
  const lines: BudgetLine[] = [];
  let flightsPending = false;

  if (transport === "driving" && driveHours != null) {
    const miles = Math.round(driveHours * CALCULATOR_RATES.DRIVE_MPH * 2);
    const gallons = miles / CALCULATOR_RATES.MPG;
    const price = gasPriceForZip(zip);
    const amount = Math.round(gallons * price * cars);
    lines.push({
      id: "gas",
      label: "Gasolina",
      amount,
      subtext: `≈ ${miles.toLocaleString("en-US")} mi ida y vuelta · ${CALCULATOR_RATES.MPG} mpg · $${price.toFixed(2)}/gal`,
    });
  }

  if (transport === "flying") {
    if (flightPricePerPerson == null || !Number.isFinite(flightPricePerPerson)) {
      flightsPending = true;
      lines.push({
        id: "flights",
        label: "Vuelos",
        amount: 0,
        excludeFromTotal: true,
        displayAmount: "Por definir",
        alwaysShow: true,
      });
    } else {
      lines.push({
        id: "flights",
        label: "Vuelos",
        amount: Math.round(flightPricePerPerson * people),
      });
    }

    lines.push({
      id: "car_rental",
      label: "Renta de carro",
      amount: Math.round(CALCULATOR_RATES.CAR_RENTAL_PER_DAY * days * cars),
    });
  }

  const entranceRaw = entranceFeeUsd ?? 0;
  const entranceAmount = Math.round(entranceRaw * cars);
  lines.push({
    id: "entrance",
    label: "Entrada al parque",
    amount: entranceAmount,
    alwaysShow: true,
    displayAmount: entranceAmount === 0 ? "Gratis" : undefined,
    tag: "dato oficial NPS",
  });

  const lodgingRate = CALCULATOR_RATES.LODGING_PER_NIGHT[style];
  lines.push({
    id: "lodging",
    label: "Hospedaje",
    amount: Math.round(lodgingRate * nights * units),
    subtext:
      style === "budget"
        ? `${nights} noche${nights === 1 ? "" : "s"} · ${units} sitio${units === 1 ? "" : "s"}`
        : `${nights} noche${nights === 1 ? "" : "s"} · ${units} habitación${units === 1 ? "" : "es"}`,
  });

  const foodRate = CALCULATOR_RATES.FOOD_PER_PERSON_DAY[style];
  lines.push({
    id: "food",
    label: "Comida",
    amount: Math.round(foodRate * people * days),
  });

  if (!hasGear) {
    lines.push({
      id: "gear",
      label: "Equipo",
      amount: CALCULATOR_RATES.GEAR_BY_STYLE[style],
    });
  }

  const total = lines
    .filter((l) => !l.excludeFromTotal)
    .reduce((sum, l) => sum + l.amount, 0);

  return {
    lines,
    total,
    perPerson: people > 0 ? Math.round(total / people) : total,
    people,
    days,
    style,
    cars,
    lodgingUnits: units,
    nights,
    flightsPending,
    forcedFlying: transportChoice.forcedFlying,
  };
}

