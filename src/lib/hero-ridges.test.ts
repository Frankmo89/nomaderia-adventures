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

  // x,y pairs of a path, curve handles included (they bound the curve).
  const points = (path: string) => {
    const nums = numbers(path);
    const out: [number, number][] = [];
    for (let i = 0; i < nums.length; i += 2) out.push([nums[i], nums[i + 1]]);
    return out;
  };
  // The phone shows the middle 375 of the 1024 units.
  const [left, right] = [(1024 - 375) / 2, (1024 + 375) / 2];

  it("Half Dome rises in the middle of the valley, whole on a 375 px phone", () => {
    const far = points(HERO_RIDGES.valleyFar.path);
    const top = Math.min(...far.map(([, y]) => y));
    const summit = far.filter(([, y]) => y === top).map(([x]) => x);
    expect(Math.min(...summit)).toBeGreaterThan(left + 100);
    expect(Math.max(...summit)).toBeLessThan(right - 100);
    // The valley walls leave the V open in front of it (only the floor there).
    const walls = points(HERO_RIDGES.valleyWalls.path).filter(([x]) => x > 485 && x < 565);
    expect(walls.length).toBeGreaterThan(0);
    expect(Math.min(...walls.map(([, y]) => y))).toBeGreaterThanOrEqual(186);
  });

  it("El Capitan and Cathedral Rocks frame the V on a 375 px phone", () => {
    const walls = points(HERO_RIDGES.valleyWalls.path);
    const highest = (from: number, to: number) => Math.min(...walls.filter(([x]) => x >= from && x <= to).map(([, y]) => y));
    expect(highest(left, 445)).toBeLessThan(20); // El Capitan
    expect(highest(600, right)).toBeLessThan(40); // Cathedral Rocks and spires
  });

  it("the pine line is a forest, not a few trees", () => {
    const { path, height } = HERO_RIDGES.valleyPines;
    const tops = points(path).filter(([, y]) => y < 40);
    expect(tops.length).toBeGreaterThan(60);
    expect(Math.min(...ys(path))).toBeGreaterThan(height / 4);
  });

  it("builds a CSS url with an encoded SVG", () => {
    const url = ridgeMaskUrl(HERO_RIDGES.mid);
    expect(url.startsWith('url("data:image/svg+xml,')).toBe(true);
    expect(decodeURIComponent(url.slice(24, -2))).toContain('viewBox="0 0 1024 72"');
    expect(url).not.toMatch(/[<>]/);
  });
});
