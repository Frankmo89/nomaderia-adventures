import { describe, expect, it } from "vitest";

import { parseNpsLatLong } from "./parse-nps-lat-long";

describe("parseNpsLatLong", () => {
  it("parses a well-formed NPS lat_long string", () => {
    expect(parseNpsLatLong("lat:36.0544, long:-112.1401")).toEqual({
      lat: 36.0544,
      lng: -112.1401,
    });
  });

  it("tolerates missing space after the comma", () => {
    expect(parseNpsLatLong("lat:38.2821653131, long:-111.247048378")).toEqual({
      lat: 38.2821653131,
      lng: -111.247048378,
    });
  });

  it("returns null for null or empty input", () => {
    expect(parseNpsLatLong(null)).toBeNull();
    expect(parseNpsLatLong("")).toBeNull();
  });

  it("returns null for malformed strings", () => {
    expect(parseNpsLatLong("not a coordinate")).toBeNull();
    expect(parseNpsLatLong("lat:, long:")).toBeNull();
    expect(parseNpsLatLong("36.0544, -112.1401")).toBeNull();
  });

  it("returns null for out-of-range values", () => {
    expect(parseNpsLatLong("lat:200, long:-112.1401")).toBeNull();
    expect(parseNpsLatLong("lat:36.0544, long:-300")).toBeNull();
  });

  it("does not throw on unexpected input", () => {
    expect(() => parseNpsLatLong(undefined as unknown as string | null)).not.toThrow();
  });
});
