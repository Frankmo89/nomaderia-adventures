import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ORIGIN_STORAGE_KEY,
  SAN_DIEGO_ORIGIN,
  driveFromOrigin,
  isOffRouteZip,
  isSanDiegoArea,
  originFromZip,
  readSavedOrigin,
  roundUpDriveHours,
  routeFrom,
  saveOrigin,
  type RouteOrigin,
} from "./landing-origin";
import { parkShortName } from "./landing-parks";

// Coordinates and San Diego hours are real values from destinations (2026-10-22).
const PARKS = [
  { title: "Parque Nacional Joshua Tree", difficulty_level: "easy", drive_time_from_san_diego: "3 horas en coche", latitude: 33.91418525, longitude: -115.8398125 },
  { title: "Parque Nacional Saguaro", difficulty_level: "easy", drive_time_from_san_diego: "5.5 horas en coche", latitude: 32.20909636, longitude: -110.7574974 },
  { title: "Parque Nacional Kings Canyon", difficulty_level: "easy", drive_time_from_san_diego: "6 horas en coche", latitude: 36.7466, longitude: -118.9706 },
  { title: "Parque Nacional Death Valley", difficulty_level: "moderate", drive_time_from_san_diego: "6 horas en coche", latitude: 36.48753731, longitude: -117.134395 },
  { title: "Parque Nacional del Gran Cañón", difficulty_level: "moderate", drive_time_from_san_diego: "7.5-8 horas en coche (South Rim)", latitude: 36.0001165336, longitude: -112.121516363 },
  { title: "Parque Nacional Petrified Forest", difficulty_level: "easy", drive_time_from_san_diego: "8 horas en coche", latitude: 34.98387664, longitude: -109.7877678 },
  { title: "Parque Nacional Zion", difficulty_level: "easy", drive_time_from_san_diego: "8 horas en coche", latitude: 37.29839254, longitude: -113.0265138 },
  { title: "Parque Nacional Channel Islands", difficulty_level: "easy", drive_time_from_san_diego: "3 horas en coche a Ventura", latitude: 33.98680093, longitude: -119.9112735 },
  { title: "Parque Nacional Volcanes de Hawái", difficulty_level: "easy", drive_time_from_san_diego: "Vuelo vía LAX o directo estacional a Kona + manejo", latitude: 19.3355036, longitude: -155.4700257 },
];

const zip = (code: string, lat: number, lon: number): RouteOrigin => ({ kind: "zip", zip: code, lat, lon });
const PHOENIX = zip("85004", 33.4511, -112.0687);
const LAS_VEGAS = zip("89101", 36.1727, -115.1236);

const names = (origin: RouteOrigin) => routeFrom(PARKS, origin).map((s) => parkShortName(s.park.title));

describe("roundUpDriveHours", () => {
  it("rounds up to half hours under 10 h and whole hours after", () => {
    expect(roundUpDriveHours(0.2)).toBe(0.5);
    expect(roundUpDriveHours(2.1)).toBe(2.5);
    expect(roundUpDriveHours(2.5)).toBe(2.5);
    expect(roundUpDriveHours(9.6)).toBe(10);
    expect(roundUpDriveHours(10.2)).toBe(11);
    expect(roundUpDriveHours(Number.NaN)).toBe(0.5);
  });
});

describe("origin helpers", () => {
  it("treats ZIPs near downtown San Diego as San Diego", () => {
    expect(isSanDiegoArea({ lat: 32.7157, lon: -117.1611 })).toBe(true);
    expect(isSanDiegoArea({ lat: 32.6401, lon: -117.0842 })).toBe(true); // Chula Vista
    expect(isSanDiegoArea({ lat: 33.4511, lon: -112.0687 })).toBe(false); // Phoenix
    expect(originFromZip("91910", { lat: 32.6401, lon: -117.0842 })).toEqual(SAN_DIEGO_ORIGIN);
    expect(originFromZip("85004", { lat: 33.4511, lon: -112.0687 })).toEqual(PHOENIX);
  });

  it("keeps islands, territories and Alaska off the road route", () => {
    expect(isOffRouteZip("96813")).toBe(true); // Honolulu
    expect(isOffRouteZip("00901")).toBe(true); // San Juan
    expect(isOffRouteZip("99501")).toBe(true); // Anchorage
    expect(isOffRouteZip("92101")).toBe(false);
    expect(isOffRouteZip("85004")).toBe(false);
  });
});

describe("driveFromOrigin", () => {
  it("uses the real hours from San Diego and an estimate from anywhere else", () => {
    expect(driveFromOrigin(SAN_DIEGO_ORIGIN, PARKS[4])).toEqual({ hours: 7.5, label: "7.5–8 h", estimated: false });
    const saguaro = driveFromOrigin(PHOENIX, PARKS[1]);
    expect(saguaro?.estimated).toBe(true);
    expect(saguaro?.label).toBe("≈ 2.5 h");
  });

  it("leaves parks that are not a road trip off the route, from any origin", () => {
    expect(driveFromOrigin(SAN_DIEGO_ORIGIN, PARKS[7])).toBeNull(); // Channel Islands: boat
    expect(driveFromOrigin(PHOENIX, PARKS[7])).toBeNull();
    expect(driveFromOrigin(PHOENIX, PARKS[8])).toBeNull(); // Hawaii
    expect(driveFromOrigin(PHOENIX, { ...PARKS[0], latitude: null })).toBeNull();
  });
});

describe("routeFrom", () => {
  it("orders by the San Diego hours by default", () => {
    expect(names(SAN_DIEGO_ORIGIN)).toEqual([
      "Joshua Tree",
      "Saguaro",
      "Kings Canyon",
      "Death Valley",
      "Gran Cañón",
      "Petrified Forest",
      "Zion",
    ]);
  });

  it("reorders from another ZIP", () => {
    expect(names(PHOENIX).slice(0, 3)).toEqual(["Saguaro", "Petrified Forest", "Gran Cañón"]);
    expect(names(LAS_VEGAS).slice(0, 3)).toEqual(["Death Valley", "Zion", "Joshua Tree"]);
  });
});

describe("saved origin", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("round-trips a ZIP and clears it for San Diego", () => {
    saveOrigin(PHOENIX);
    expect(readSavedOrigin()).toEqual(PHOENIX);
    saveOrigin(SAN_DIEGO_ORIGIN);
    expect(readSavedOrigin()).toBeNull();
  });

  it("ignores junk and storage that throws", () => {
    window.localStorage.setItem(ORIGIN_STORAGE_KEY, "{not json");
    expect(readSavedOrigin()).toBeNull();
    window.localStorage.setItem(ORIGIN_STORAGE_KEY, JSON.stringify({ zip: "8500", lat: 1, lon: 2 }));
    expect(readSavedOrigin()).toBeNull();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readSavedOrigin()).toBeNull();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => saveOrigin(PHOENIX)).not.toThrow();
  });
});
