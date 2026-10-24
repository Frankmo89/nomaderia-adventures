import { describe, expect, it } from "vitest";
import { HERO_RIDGES, ridgeMaskUrl } from "./hero-ridges";

const numbers = (path: string) => (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
const ys = (path: string) => numbers(path).filter((_, i) => i % 2 === 1);

describe("hero ridges", () => {
  it.each(Object.entries(HERO_RIDGES))("%s stays inside its band and closes at the bottom", (_, ridge) => {
    const values = ys(ridge.path);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    // Pine trunks may dip 2 px below the hill line, never below the band + 2.
    expect(Math.max(...values)).toBeLessThanOrEqual(ridge.height + 2);
    expect(ridge.path.startsWith(`M0,${ridge.height}`)).toBe(true);
    expect(ridge.path).toContain(`L1024,${ridge.height} Z`);
  });

  it("stacks far to near: each range sits lower than the one behind", () => {
    const peak = (r: { height: number; path: string }) => Math.min(...ys(r.path)) - r.height;
    // Peaks measured from the text line (bottom of every band).
    expect(peak(HERO_RIDGES.back)).toBeLessThan(peak(HERO_RIDGES.mid));
    expect(peak(HERO_RIDGES.mid)).toBeLessThan(peak(HERO_RIDGES.front));
  });

  it("builds a CSS url with an encoded SVG", () => {
    const url = ridgeMaskUrl(HERO_RIDGES.mid);
    expect(url.startsWith('url("data:image/svg+xml,')).toBe(true);
    expect(decodeURIComponent(url.slice(24, -2))).toContain('viewBox="0 0 1024 92"');
    expect(url).not.toMatch(/[<>]/);
  });
});
