import { describe, expect, it } from "vitest";
import { GROVE, groveMaskUrl, mirror } from "./sequoia-silhouettes";

const pairs = (path: string) => (path.match(/-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?/g) ?? []).map((p) => p.split(",").map(Number));

describe("sequoia silhouettes", () => {
  it.each(Object.entries(GROVE))("%s stays inside its box and uses straight segments", (_, s) => {
    expect(s.path).not.toMatch(/[CQSA]/);
    for (const [x, y] of pairs(s.path)) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(s.width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(s.height);
    }
  });

  it("a trunk is a column that flares at its base", () => {
    const xsAt = (y: number) => pairs(GROVE.trunk.path).filter(([, py]) => py === y).map(([x]) => x);
    const top = Math.max(...xsAt(0)) - Math.min(...xsAt(0));
    const base = Math.max(...xsAt(400)) - Math.min(...xsAt(400));
    expect(base).toBeGreaterThan(top * 1.5);
  });

  it("the canopy hangs lower at the trunk side than toward the middle", () => {
    const lowest = (from: number, to: number) =>
      Math.max(...pairs(GROVE.canopy.path).filter(([x]) => x >= from && x <= to).map(([, y]) => y));
    expect(lowest(0, 40)).toBeGreaterThan(lowest(160, 200) + 60);
  });

  it("mirrors a shape across its box", () => {
    const m = mirror(GROVE.trunk);
    expect(pairs(m.path)[0]).toEqual([78, 0]);
    expect(mirror(m).path).toBe(GROVE.trunk.path);
  });

  it("builds a stretched, encoded mask url", () => {
    const url = groveMaskUrl(GROVE.canopy);
    expect(url).not.toMatch(/[<>]/);
    expect(decodeURIComponent(url)).toContain('preserveAspectRatio="none"');
  });
});
