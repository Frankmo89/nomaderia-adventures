import { describe, expect, it } from "vitest";
import { scrollDepth } from "./use-scroll-depth";

describe("scrollDepth", () => {
  it("is 0 while the section is still below the screen", () => {
    expect(scrollDepth(900, 500, 800)).toEqual({ entered: -100, progress: 0, viewport: 800, height: 500 });
  });

  it("is halfway when the section's middle crosses the screen's middle", () => {
    // top 150, height 500: middle at 400 = middle of an 800 px screen.
    expect(scrollDepth(150, 500, 800).progress).toBeCloseTo(0.5);
  });

  it("is 1 once the section has left through the top", () => {
    expect(scrollDepth(-600, 500, 800).progress).toBe(1);
  });

  it("tells how far a tall section has scrolled while it fills the screen (sticky stage)", () => {
    // 2000 px section on an 800 px screen, scrolled 600 px past its top.
    const d = scrollDepth(-600, 2000, 800);
    expect((d.entered - d.viewport) / (d.height - d.viewport)).toBeCloseTo(0.5);
  });

  it("gives the hero (top of the page) entered = screen + scroll", () => {
    // Scrolled 120 px: the hero's top sits at -120.
    expect(scrollDepth(-120, 844, 844).entered - 844).toBe(120);
  });
});
