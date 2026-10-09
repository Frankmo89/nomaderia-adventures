import { describe, expect, it } from "vitest";
import { GEAR_CATEGORY_LABEL, gearCategoryLabel } from "./gear-categories";

describe("gear categories", () => {
  it("shows stored English keys in Spanish", () => {
    expect(gearCategoryLabel("boots")).toBe("Botas");
    expect(gearCategoryLabel("tents")).toBe("Casas de campaña");
  });
  it("keeps unknown or empty categories readable", () => {
    expect(gearCategoryLabel("otra")).toBe("otra");
    expect(gearCategoryLabel(null)).toBe("");
  });
  it("covers every key the admin and homepage used before", () => {
    for (const k of ["boots", "poles", "cameras", "backpacks", "clothing", "accessories"]) {
      expect(GEAR_CATEGORY_LABEL[k]).toBeTruthy();
    }
  });
});
