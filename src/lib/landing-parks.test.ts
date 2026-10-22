import { describe, expect, it } from "vitest";
import {
  daysLabel,
  entranceFeeLabel,
  highlightLine,
  parkShortName,
  parseDriveFromSanDiego,
  shortBestSeason,
} from "./landing-parks";

// Fixtures are real values from destinations (2026-10-22).
describe("parseDriveFromSanDiego", () => {
  it("reads plain drives", () => {
    expect(parseDriveFromSanDiego("3 horas en coche")).toEqual({ hours: 3, label: "3 h" });
    expect(parseDriveFromSanDiego("7.5-8 horas en coche (South Rim)")).toEqual({ hours: 7.5, label: "7.5–8 h" });
    expect(parseDriveFromSanDiego("10.5-11 horas en coche (o volar a El Paso y manejar 1.5 h)")).toEqual({ hours: 10.5, label: "10.5–11 h" });
    expect(parseDriveFromSanDiego("44+ horas en coche (volar a Boston/Bangor)")).toEqual({ hours: 44, label: "44+ h" });
  });

  it("rejects anything that is not a plain drive to the park", () => {
    expect(parseDriveFromSanDiego("3 horas en coche a Ventura")).toBeNull();
    expect(parseDriveFromSanDiego("Sin carretera: vía Anchorage a Kotzebue + avioneta")).toBeNull();
    expect(parseDriveFromSanDiego("Vuelo vía LAX o directo estacional a Kona + manejo")).toBeNull();
    expect(parseDriveFromSanDiego(null)).toBeNull();
  });
});

describe("shortBestSeason", () => {
  it("keeps the first clause when it names a time of year", () => {
    expect(shortBestSeason("Octubre a abril, con clima templado. La primavera trae flores del desierto.")).toBe("Octubre a abril");
    expect(shortBestSeason("Marzo-mayo y septiembre-noviembre: clima benigno en el South Rim.")).toBe("Marzo–mayo y septiembre–noviembre");
    expect(shortBestSeason("Abril-junio para las cascadas en su punto máximo (el deshielo las llena)")).toBe("Abril–junio");
    expect(shortBestSeason("Todo el año — la cueva está a 12°C constantes.")).toBe("Todo el año");
    expect(shortBestSeason("Junio a septiembre es lo más seco, ideal para los bosques")).toBe("Junio a septiembre");
  });

  it("returns null when the clause is not a time of year", () => {
    expect(shortBestSeason("Depende mucho del clima del día")).toBeNull();
    expect(shortBestSeason(null)).toBeNull();
  });
});

describe("entranceFeeLabel", () => {
  it("formats fees", () => {
    expect(entranceFeeLabel(30, "por vehículo")).toBe("$30 por carro");
    expect(entranceFeeLabel("35.0", "por vehículo")).toBe("$35 por carro");
    expect(entranceFeeLabel(15, "por persona")).toBe("$15 por persona");
    expect(entranceFeeLabel(0, "gratis")).toBe("Entrada gratis");
    expect(entranceFeeLabel(null, null)).toBeNull();
  });
});

describe("daysLabel", () => {
  it("uses an en dash for ranges", () => {
    expect(daysLabel("2-3 días")).toBe("2–3 días");
    expect(daysLabel("Medio día")).toBe("Medio día");
  });
});

describe("highlightLine", () => {
  it("keeps the sentence as written, on one line", () => {
    expect(highlightLine("El cielo estrellado desde Cholla Cactus Garden — cero contaminación lumínica.")).toBe(
      "El cielo estrellado desde Cholla Cactus Garden — cero contaminación lumínica.",
    );
    expect(highlightLine("  Ver el atardecer\n entre cactus  ")).toBe("Ver el atardecer entre cactus");
    expect(highlightLine("   ")).toBeNull();
    expect(highlightLine(null)).toBeNull();
  });
});

describe("parkShortName", () => {
  it("drops the Parque Nacional prefix", () => {
    expect(parkShortName("Parque Nacional Joshua Tree")).toBe("Joshua Tree");
    expect(parkShortName("Parque Nacional del Gran Cañón")).toBe("Gran Cañón");
    expect(parkShortName("Parque Nacional y Reserva Great Sand Dunes")).toBe("Great Sand Dunes");
    expect(parkShortName("Yosemite")).toBe("Yosemite");
  });
});
