import { describe, expect, it } from "vitest";
import { CALCULATOR_RATES } from "@/config/calculator-rates";
import {
  calculateBudget,
  carsNeeded,
  gasPriceForZip,
  lodgingUnits,
  nightsForTrip,
  parseDriveToPort,
  resolveCalculatorTransport,
  resolveDriveHoursForCalc,
  resolveTransport,
  transportToSeed,
  type BudgetCalcInput,
} from "@/lib/budget-calc";
import { SAN_DIEGO_ORIGIN } from "@/lib/landing-origin";

/** Real San Diego → Joshua Tree hours from destinations.drive_time_from_san_diego. */
const JOSHUA_TREE = {
  driveHours: 3,
  entranceFeeUsd: 30,
  latitude: 33.91418525,
  longitude: -115.8398125,
};

const CHANNEL_ISLANDS = {
  drive_time_from_san_diego: "3 horas en coche a Ventura",
  latitude: 33.98680093,
  longitude: -119.9112735,
  entranceFeeUsd: 0,
};

const base = (overrides: Partial<BudgetCalcInput> = {}): BudgetCalcInput => ({
  people: 2,
  days: 3,
  style: "mid",
  transport: "driving",
  driveHours: JOSHUA_TREE.driveHours,
  zip: "92101",
  entranceFeeUsd: JOSHUA_TREE.entranceFeeUsd,
  entranceFeeType: "por vehículo",
  flightPricePerPerson: null,
  hasGear: false,
  ...overrides,
});

describe("resolveTransport", () => {
  it("defaults to Manejando under 10 h", () => {
    expect(resolveTransport(3)).toEqual({
      mode: "driving",
      forcedFlying: false,
      message: null,
    });
  });

  it("defaults to Volando at or above 10 h", () => {
    expect(resolveTransport(10).mode).toBe("flying");
    expect(resolveTransport(12).forcedFlying).toBe(false);
  });

  it("forces Volando when the park has no road access", () => {
    const choice = resolveTransport(null);
    expect(choice.mode).toBe("flying");
    expect(choice.forcedFlying).toBe(true);
    expect(choice.message).toMatch(/no tiene acceso por carretera/);
  });
});

describe("resolveCalculatorTransport — off-route ZIPs", () => {
  it("Honolulu ZIP forces flying even when the park has road hours", () => {
    const choice = resolveCalculatorTransport(3, "96813");
    expect(choice.mode).toBe("flying");
    expect(choice.forcedFlying).toBe(true);
    expect(choice.message).toMatch(/no tiene acceso por carretera/);
  });

  it("Alaska ZIP forces flying", () => {
    expect(resolveCalculatorTransport(5, "99501").forcedFlying).toBe(true);
  });

  it("San Diego ZIP keeps driving under 10 h", () => {
    expect(resolveCalculatorTransport(3, "92101")).toEqual({
      mode: "driving",
      forcedFlying: false,
      message: null,
    });
  });
});

describe("parseDriveToPort", () => {
  it("parses Channel Islands drive-to-port hours", () => {
    expect(parseDriveToPort("3 horas en coche a Ventura")).toBe(3);
  });

  it("rejects plain road drives and flight strings", () => {
    expect(parseDriveToPort("3 horas en coche")).toBeNull();
    expect(parseDriveToPort("7.5-8 horas en coche (South Rim)")).toBeNull();
    expect(parseDriveToPort("Vuelo vía LAX")).toBeNull();
    expect(parseDriveToPort(null)).toBeNull();
  });
});

describe("resolveDriveHoursForCalc — ferry parks", () => {
  it("Channel Islands from San Diego → 3 h drive to port + needsFerry", () => {
    const resolved = resolveDriveHoursForCalc(SAN_DIEGO_ORIGIN, CHANNEL_ISLANDS);
    expect(resolved).toEqual({ hours: 3, needsFerry: true });
  });

  it("Joshua Tree from San Diego → road hours, no ferry", () => {
    const resolved = resolveDriveHoursForCalc(SAN_DIEGO_ORIGIN, {
      drive_time_from_san_diego: "3 horas en coche",
      latitude: JOSHUA_TREE.latitude,
      longitude: JOSHUA_TREE.longitude,
    });
    expect(resolved.needsFerry).toBe(false);
    expect(resolved.hours).toBe(3);
  });
});

describe("helpers", () => {
  it("uses CA gas for ZIP prefixes 900–961 and US otherwise", () => {
    expect(gasPriceForZip("92101")).toBe(CALCULATOR_RATES.GAS_PRICE_CA);
    expect(gasPriceForZip("90001")).toBe(CALCULATOR_RATES.GAS_PRICE_CA);
    expect(gasPriceForZip("96150")).toBe(CALCULATOR_RATES.GAS_PRICE_CA);
    expect(gasPriceForZip("10001")).toBe(CALCULATOR_RATES.GAS_PRICE_US);
    expect(gasPriceForZip("85004")).toBe(CALCULATOR_RATES.GAS_PRICE_US);
  });

  it("ceil(people/5) cars and ceil(people/4) hotel rooms", () => {
    expect(carsNeeded(6)).toBe(2);
    expect(lodgingUnits(6, "mid")).toBe(2);
    expect(lodgingUnits(6, "premium")).toBe(2);
    expect(lodgingUnits(6, "budget")).toBe(1);
  });

  it("1 day → 1 night", () => {
    expect(nightsForTrip(1)).toBe(1);
    expect(nightsForTrip(3)).toBe(2);
  });
});

describe("calculateBudget — Joshua Tree from San Diego", () => {
  it("2 people, 3 days, Cómodo, driving", () => {
    const result = calculateBudget(base());

    const miles = 3 * CALCULATOR_RATES.DRIVE_MPH * 2; // 390
    const gallons = miles / CALCULATOR_RATES.MPG;
    const gas = Math.round(gallons * CALCULATOR_RATES.GAS_PRICE_CA * 1);

    const gasLine = result.lines.find((l) => l.id === "gas");
    expect(gasLine?.amount).toBe(gas);
    expect(gasLine?.subtext).toContain(`${miles} mi ida y vuelta`);
    expect(gasLine?.subtext).toContain(`${CALCULATOR_RATES.MPG} mpg`);
    expect(gasLine?.subtext).toContain(`$${CALCULATOR_RATES.GAS_PRICE_CA.toFixed(2)}/gal`);

    const entrance = result.lines.find((l) => l.id === "entrance");
    expect(entrance?.amount).toBe(30);
    expect(entrance?.subtext).toBe("por carro");
    expect(entrance?.tag).toBe("dato oficial NPS");

    expect(result.nights).toBe(2);
    expect(result.lodgingUnits).toBe(1);
    expect(result.lines.find((l) => l.id === "lodging")?.amount).toBe(150 * 2 * 1);
    expect(result.lines.find((l) => l.id === "food")?.amount).toBe(45 * 2 * 3);
    expect(result.lines.find((l) => l.id === "gear")?.amount).toBe(100);
    expect(result.lines.find((l) => l.id === "flights")).toBeUndefined();
    expect(result.lines.find((l) => l.id === "car_rental")).toBeUndefined();

    expect(result.total).toBe(gas + 30 + 300 + 270 + 100);
    expect(result.perPerson).toBe(Math.round(result.total / 2));
  });

  it("omits gear when Ya tengo equipo is on", () => {
    const result = calculateBudget(base({ hasGear: true }));
    expect(result.lines.find((l) => l.id === "gear")).toBeUndefined();
  });
});

describe("calculateBudget — Channel Islands ferry", () => {
  it("from San Diego → driving, gas for 3 h, Ferry Por cotizar left out of total", () => {
    const driveHours = 3;
    const result = calculateBudget(
      base({
        driveHours,
        transport: "driving",
        entranceFeeUsd: 0,
        entranceFeeType: "gratis",
        needsFerry: true,
      }),
    );

    expect(result.forcedFlying).toBe(false);
    const miles = driveHours * CALCULATOR_RATES.DRIVE_MPH * 2;
    const gallons = miles / CALCULATOR_RATES.MPG;
    const gas = Math.round(gallons * CALCULATOR_RATES.GAS_PRICE_CA * 1);
    expect(result.lines.find((l) => l.id === "gas")?.amount).toBe(gas);

    const ferry = result.lines.find((l) => l.id === "ferry");
    expect(ferry?.displayAmount).toBe("Por cotizar");
    expect(ferry?.excludeFromTotal).toBe(true);
    expect(ferry?.subtext).toMatch(/ferry a la isla/i);

    expect(result.lines.find((l) => l.id === "flights")).toBeUndefined();
    const withoutExcluded = result.lines
      .filter((l) => !l.excludeFromTotal)
      .reduce((s, l) => s + l.amount, 0);
    expect(result.total).toBe(withoutExcluded);
    expect(result.total).toBe(gas + 0 + 300 + 270 + 100);
  });
});

describe("calculateBudget — entrance fee type", () => {
  it("por persona → fee × people", () => {
    const result = calculateBudget(
      base({
        people: 4,
        entranceFeeUsd: 15,
        entranceFeeType: "por persona",
      }),
    );
    const entrance = result.lines.find((l) => l.id === "entrance");
    expect(entrance?.amount).toBe(60);
    expect(entrance?.subtext).toBe("por persona");
  });

  it("por vehículo → fee × cars", () => {
    const result = calculateBudget(
      base({
        people: 6,
        entranceFeeUsd: 30,
        entranceFeeType: "por vehículo",
      }),
    );
    expect(result.cars).toBe(2);
    const entrance = result.lines.find((l) => l.id === "entrance");
    expect(entrance?.amount).toBe(60);
    expect(entrance?.subtext).toBe("por carro");
  });

  it("gratis or 0 → Gratis", () => {
    const freeType = calculateBudget(
      base({ entranceFeeUsd: 30, entranceFeeType: "gratis" }),
    );
    expect(freeType.lines.find((l) => l.id === "entrance")?.displayAmount).toBe("Gratis");

    const zeroFee = calculateBudget(
      base({ entranceFeeUsd: 0, entranceFeeType: "por vehículo" }),
    );
    expect(zeroFee.lines.find((l) => l.id === "entrance")?.displayAmount).toBe("Gratis");
  });
});

describe("calculateBudget — lodging copy", () => {
  it("5 people, Cómodo → 2 habitaciones (no accent on plural)", () => {
    const result = calculateBudget(
      base({ people: 5, style: "mid" }),
    );
    expect(result.lodgingUnits).toBe(2);
    const lodging = result.lines.find((l) => l.id === "lodging");
    expect(lodging?.subtext).toContain("2 habitaciones");
    expect(lodging?.subtext).not.toContain("habitaciónes");
  });
});

describe("calculateBudget — flights and capacity", () => {
  it("rejects a negative flight price", () => {
    expect(() =>
      calculateBudget(
        base({
          transport: "flying",
          flightPricePerPerson: -10,
        }),
      ),
    ).toThrow(/negativo/i);
  });

  it("6 people → 2 cars and 2 hotel rooms", () => {
    const result = calculateBudget(
      base({
        people: 6,
        style: "mid",
        transport: "flying",
        flightPricePerPerson: 120,
      }),
    );
    expect(result.cars).toBe(2);
    expect(result.lodgingUnits).toBe(2);
    expect(result.lines.find((l) => l.id === "flights")?.amount).toBe(120 * 6);
    expect(result.lines.find((l) => l.id === "car_rental")?.amount).toBe(
      CALCULATOR_RATES.CAR_RENTAL_PER_DAY * 3 * 2,
    );
    expect(result.lines.find((l) => l.id === "entrance")?.amount).toBe(30 * 2);
  });

  it("1 day → 1 night of lodging", () => {
    const result = calculateBudget(base({ days: 1 }));
    expect(result.nights).toBe(1);
    expect(result.lines.find((l) => l.id === "lodging")?.amount).toBe(150 * 1 * 1);
  });

  it("no-road park forces flying even if driving was requested", () => {
    const result = calculateBudget(
      base({
        driveHours: null,
        transport: "driving",
        flightPricePerPerson: null,
        entranceFeeUsd: 0,
        entranceFeeType: "gratis",
      }),
    );
    expect(result.forcedFlying).toBe(true);
    expect(result.lines.find((l) => l.id === "gas")).toBeUndefined();
    expect(result.lines.find((l) => l.id === "flights")?.displayAmount).toBe("Por definir");
    expect(result.flightsPending).toBe(true);
    expect(result.lines.find((l) => l.id === "car_rental")).toBeDefined();
    expect(result.lines.find((l) => l.id === "entrance")?.displayAmount).toBe("Gratis");
    // Pending flights are out of the total
    const withoutFlights = result.lines
      .filter((l) => !l.excludeFromTotal)
      .reduce((s, l) => s + l.amount, 0);
    expect(result.total).toBe(withoutFlights);
  });

  it("Honolulu ZIP forces flying via calculateBudget", () => {
    const result = calculateBudget(
      base({
        zip: "96813",
        driveHours: 3,
        transport: "driving",
        flightPricePerPerson: null,
      }),
    );
    expect(result.forcedFlying).toBe(true);
    expect(result.lines.find((l) => l.id === "gas")).toBeUndefined();
    expect(result.lines.find((l) => l.id === "flights")?.displayAmount).toBe("Por definir");
  });

  it("shows Gratis entrance at $0 and always includes the line", () => {
    const result = calculateBudget(base({ entranceFeeUsd: 0 }));
    const entrance = result.lines.find((l) => l.id === "entrance");
    expect(entrance?.alwaysShow).toBe(true);
    expect(entrance?.displayAmount).toBe("Gratis");
    expect(entrance?.amount).toBe(0);
  });
});

describe("transportToSeed", () => {
  const forced = { mode: "flying" as const, forcedFlying: true, message: "x" };
  const drive = { mode: "driving" as const, forcedFlying: false, message: null };
  const fly = { mode: "flying" as const, forcedFlying: false, message: null };

  it("writes nothing when a no-road park already shows Volando (the freeze)", () => {
    expect(transportToSeed("flying", forced, false)).toBeNull();
    expect(transportToSeed("flying", forced, true)).toBeNull();
  });

  it("forces Volando when the form still says Manejando", () => {
    expect(transportToSeed("driving", forced, false)).toBe("flying");
  });

  it("re-seeds the default only when park, origin or ZIP changed", () => {
    expect(transportToSeed("driving", fly, true)).toBe("flying");
    expect(transportToSeed("flying", drive, true)).toBe("driving");
    expect(transportToSeed("driving", drive, true)).toBeNull();
  });

  it("keeps the visitor's own pick while nothing changed", () => {
    expect(transportToSeed("flying", drive, false)).toBeNull();
    expect(transportToSeed("driving", fly, false)).toBeNull();
  });
});
