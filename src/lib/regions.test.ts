import { describe, expect, it } from "vitest";

import { formatRegionDisplay } from "./regions";

describe("formatRegionDisplay", () => {
  it("returns an empty string for nullish or empty input", () => {
    expect(formatRegionDisplay(null)).toBe("");
    expect(formatRegionDisplay(undefined as unknown as string | null)).toBe("");
    expect(formatRegionDisplay("")).toBe("");
  });

  it("expands a single valid state code", () => {
    expect(formatRegionDisplay("CA")).toBe("California");
  });

  it("joins two valid state codes with an ampersand", () => {
    expect(formatRegionDisplay("CA,NV")).toBe("California & Nevada");
  });

  it("joins three valid state codes in order", () => {
    expect(formatRegionDisplay("ID,MT,WY")).toBe("Idaho & Montana & Wyoming");
  });

  it("preserves unknown codes as-is", () => {
    expect(formatRegionDisplay("ZZ")).toBe("ZZ");
  });

  it("trims whitespace around codes before formatting", () => {
    expect(formatRegionDisplay("CA, NV")).toBe("California & Nevada");
  });
});
