import { describe, expect, it } from "vitest";
import { scrollDepth } from "./use-scroll-depth";

describe("scrollDepth", () => {
  it("is 0 while the section is still below the screen", () => {
    expect(scrollDepth(900, 500, 800)).toEqual({ entered: -100, progress: 0, viewport: 800 });
  });

  it("is halfway when the section's middle crosses the screen's middle", () => {
    // top 150, height 500: middle at 400 = middle of an 800 px screen.
    expect(scrollDepth(150, 500, 800).progress).toBeCloseTo(0.5);
  });

  it("is 1 once the section has left through the top", () => {
    expect(scrollDepth(-600, 500, 800).progress).toBe(1);
  });

  it("gives the hero (top of the page) entered = screen + scroll", () => {
    // Scrolled 120 px: the hero's top sits at -120.
    expect(scrollDepth(-120, 844, 844).entered - 844).toBe(120);
  });
});
