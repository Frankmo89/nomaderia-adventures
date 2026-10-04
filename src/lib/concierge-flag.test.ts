import { describe, expect, it } from "vitest";
import { isConciergeEnabled } from "./concierge-flag";

describe("concierge flag", () => {
  it("is off unless the value is exactly true", () => {
    expect(isConciergeEnabled(undefined)).toBe(false);
    expect(isConciergeEnabled("")).toBe(false);
    expect(isConciergeEnabled("false")).toBe(false);
    expect(isConciergeEnabled("1")).toBe(false);
    expect(isConciergeEnabled("true")).toBe(true);
    expect(isConciergeEnabled()).toBe(false);
  });
});
