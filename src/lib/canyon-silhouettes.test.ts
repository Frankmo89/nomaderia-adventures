import { describe, expect, it } from "vitest";
import { CANYON, canyonMaskUrl, mirrorShape } from "./canyon-silhouettes";

const pairs = (path: string) => (path.match(/-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?/g) ?? []).map((p) => p.split(",").map(Number));

describe("canyon silhouettes", () => {
  it.each(Object.entries(CANYON))("%s stays inside its box and uses straight segments", (_, s) => {
    expect(s.path).not.toMatch(/[CQSA]/);
    for (const [x, y] of pairs(s.path)) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(s.width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(s.height);
    }
  });

  it("layers recede: near walls rise highest, then the middle walls, the buttes, the far rim", () => {
    const top = (path: string) => Math.min(...pairs(path).map(([, y]) => y));
    expect(top(CANYON.nearWall.path)).toBeLessThan(top(CANYON.farRim.path));
    expect(top(CANYON.farRim.path)).toBeLessThan(top(CANYON.midWall.path));
    expect(top(CANYON.midWall.path)).toBeLessThan(top(CANYON.buttes.path));
  });

  it("mirrors a wall across its box", () => {
    const m = mirrorShape(CANYON.nearWall);
    expect(pairs(m.path)[1]).toEqual([200, 40]);
    expect(mirrorShape(m).path).toBe(CANYON.nearWall.path);
  });

  it("builds a stretched, encoded mask url", () => {
    const url = canyonMaskUrl(CANYON.buttes);
    expect(url).not.toMatch(/[<>]/);
    expect(decodeURIComponent(url)).toContain('preserveAspectRatio="none"');
  });
});
