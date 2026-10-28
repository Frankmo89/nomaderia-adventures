import { CALCULATOR_RATES } from "@/config/calculator-rates";
import {
  driveFromOrigin,
  estimateDriveHours,
  isOffRouteZip,
  type RouteOrigin,
} from "@/lib/landing-origin";

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
  /** True when the UI must lock to Volando (no road, or off-route ZIP). */
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

/**
 * Same as resolveTransport, but Hawaiʻi / Alaska / territories force Volando
 * (no road trip from home to the parks on this route).
 */
export function resolveCalculatorTransport(
  driveHours: number | null,
  zip: string,
): TransportChoice {
  if (isOffRouteZip(zip)) {
    return resolveTransport(null);
  }
  return resolveTransport(driveHours);
}

/**
 * "3 horas en coche a Ventura" → 3.
 * Only drive-to-port strings (boat parks). Plain "3 horas en coche" returns null
 * (that is parseDriveFromSanDiego / driveFromOrigin territory).
 */
export function parseDriveToPort(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const m = raw
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s+horas?\s+en\s+coche\s+a\s+.+/i);
  if (!m) return null;
  return Number(m[1]);
}

export interface DriveHoursForCalc {
  hours: number | null;
  /** True when the San Diego column is a drive-to-port (ferry) park. */
  needsFerry: boolean;
}

interface CalcPark {
  latitude: number | null;
  longitude: number | null;
  drive_time_from_san_diego: string | null;
}

/**
 * Effective drive hours for the calculator.
 * Road parks → driveFromOrigin(). Ferry (drive-to-port) parks → San Diego
 * port hours, or estimateDriveHours from any other ZIP. Pure no-road → null.
 */
export function resolveDriveHoursForCalc(
  origin: RouteOrigin,
  park: CalcPark,
): DriveHoursForCalc {
  const road = driveFromOrigin(origin, park);
  if (road) return { hours: road.hours, needsFerry: false };

  const portHours = parseDriveToPort(park.drive_time_from_san_diego);
  if (portHours == null) return { hours: null, needsFerry: false };

  if (origin.kind === "san-diego") {
    return { hours: portHours, needsFerry: true };
  }
  if (park.latitude == null || park.longitude == null) {
    return { hours: portHours, needsFerry: true };
  }
  return {
    hours: estimateDriveHours(origin, { lat: park.latitude, lon: park.longitude }),
    needsFerry: true,
  };
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
  /** Hours from resolveDriveHoursForCalc(); null = no road (must fly). */
  driveHours: number | null;
  zip: string;
  entranceFeeUsd: number | null | undefined;
  /** 'por persona' | 'por vehículo' | 'gratis' (destinations.entrance_fee_type). */
  entranceFeeType?: string | null;
  /**
   * USD per person. null/undefined = "Por definir" (excluded from total).
   * Negatives are rejected.
   */
  flightPricePerPerson?: number | null;
  /** When true, gear line is omitted. */
  hasGear: boolean;
  /** Drive-to-port (ferry) park — add Ferry "Por cotizar" outside the total. */
  needsFerry?: boolean;
}

export interface BudgetLine {
  id: "gas" | "flights" | "car_rental" | "ferry" | "entrance" | "lodging" | "food" | "gear";
  label: string;
  amount: number;
  /** Shown even when amount is 0 (Entrada → "Gratis"). */
  alwaysShow?: boolean;
  /** Leave out of the total (empty flight price / ferry quote). */
  excludeFromTotal?: boolean;
  /** Display "Por definir" / "Gratis" / "Por cotizar" instead of $0. */
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

function entranceLine(
  feeUsd: number | null | undefined,
  feeType: string | null | undefined,
  people: number,
  cars: number,
): BudgetLine {
  const type = (feeType ?? "").trim().toLowerCase();
  const raw = feeUsd ?? 0;

  if (type === "gratis" || raw === 0) {
    return {
      id: "entrance",
      label: "Entrada al parque",
      amount: 0,
      alwaysShow: true,
      displayAmount: "Gratis",
      tag: "dato oficial NPS",
    };
  }

  if (type === "por persona") {
    return {
      id: "entrance",
      label: "Entrada al parque",
      amount: Math.round(raw * people),
      alwaysShow: true,
      subtext: "por persona",
      tag: "dato oficial NPS",
    };
  }

  // 'por vehículo' or unknown → per car (historical default)
  return {
    id: "entrance",
    label: "Entrada al parque",
    amount: Math.round(raw * cars),
    alwaysShow: true,
    subtext: "por carro",
    tag: "dato oficial NPS",
  };
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
    entranceFeeType,
    flightPricePerPerson,
    hasGear,
    needsFerry = false,
  } = input;

  if (
    flightPricePerPerson != null &&
    Number.isFinite(flightPricePerPerson) &&
    flightPricePerPerson < 0
  ) {
    throw new RangeError("El precio del vuelo no puede ser negativo");
  }

  const transportChoice = resolveCalculatorTransport(driveHours, zip);
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

  if (needsFerry) {
    lines.push({
      id: "ferry",
      label: "Ferry",
      amount: 0,
      excludeFromTotal: true,
      displayAmount: "Por cotizar",
      alwaysShow: true,
      subtext: "El ferry a la isla lo cotizamos en tu itinerario.",
    });
  }

  lines.push(entranceLine(entranceFeeUsd, entranceFeeType, people, cars));

  const lodgingRate = CALCULATOR_RATES.LODGING_PER_NIGHT[style];
  const lodgingUnitLabel =
    style === "budget"
      ? `${units} sitio${units === 1 ? "" : "s"}`
      : `${units} ${units === 1 ? "habitación" : "habitaciones"}`;
  lines.push({
    id: "lodging",
    label: "Hospedaje",
    amount: Math.round(lodgingRate * nights * units),
    subtext: `${nights} noche${nights === 1 ? "" : "s"} · ${lodgingUnitLabel}`,
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
