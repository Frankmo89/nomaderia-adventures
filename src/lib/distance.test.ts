import { describe, it, expect } from "vitest";
import {
  haversineKm,
  getDistanceBucket,
  getDistanceFromOrigin,
  SAN_DIEGO_ORIGIN,
} from "./distance";

describe("haversineKm", () => {
  it("is ~0 for the same point", () => {
    expect(haversineKm(32.7157, -117.1611, 32.7157, -117.1611)).toBeCloseTo(0, 5);
  });

  it("matches a known distance (San Diego → Los Angeles ≈ 178 km)", () => {
    const km = haversineKm(32.7157, -117.1611, 34.0522, -118.2437);
    expect(km).toBeGreaterThan(170);
    expect(km).toBeLessThan(190);
  });
});

describe("getDistanceBucket", () => {
  it("buckets near / mid / far by km", () => {
    expect(getDistanceBucket(100)).toBe("cerca");
    expect(getDistanceBucket(240)).toBe("media");
    expect(getDistanceBucket(640)).toBe("media");
    expect(getDistanceBucket(641)).toBe("lejos");
  });
});

describe("getDistanceFromOrigin", () => {
  it("returns null when the park has no coordinates", () => {
    expect(getDistanceFromOrigin(SAN_DIEGO_ORIGIN, { latitude: null, longitude: null })).toBeNull();
    expect(getDistanceFromOrigin(SAN_DIEGO_ORIGIN, { latitude: 36.5, longitude: null })).toBeNull();
  });

  it("estimates drive hours for a nearby park (San Diego → Joshua Tree)", () => {
    const r = getDistanceFromOrigin(SAN_DIEGO_ORIGIN, { latitude: 33.8734, longitude: -115.901 });
    expect(r).not.toBeNull();
    expect(r!.recommendFlight).toBe(false);
    expect(r!.driveHoursEstimate).toBeGreaterThanOrEqual(2);
    expect(r!.driveHoursEstimate).toBeLessThanOrEqual(4);
    expect(r!.miles).toBeGreaterThan(0);
  });

  it("recommends a flight past the ~1500 km threshold (Miami → Yosemite)", () => {
    const miami = { lat: 25.7617, lng: -80.1918 };
    const r = getDistanceFromOrigin(miami, { latitude: 37.8651, longitude: -119.5383 });
    expect(r).not.toBeNull();
    expect(r!.recommendFlight).toBe(true);
    expect(r!.driveHoursEstimate).toBeNull();
    expect(r!.miles).toBeGreaterThan(2000);
  });

  it("never returns a drive estimate below 1 hour for a non-zero distance", () => {
    const r = getDistanceFromOrigin(SAN_DIEGO_ORIGIN, { latitude: 32.75, longitude: -117.2 });
    expect(r!.driveHoursEstimate).toBeGreaterThanOrEqual(1);
  });
});
