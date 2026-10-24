import { describe, expect, it } from "vitest";
import { CANYON, canyonMaskUrl, mirrorShape, riverAt } from "./canyon-silhouettes";

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

  it("the river runs from the buttes to the bottom edge, widening as it comes closer", () => {
    expect(riverAt(0).y).toBe(262);
    expect(riverAt(1).y).toBe(400);
    expect(riverAt(1).half).toBeGreaterThan(riverAt(0.5).half * 3);
    // Its glow is a wider band around it.
    const xs = (path: string) => pairs(path).filter(([, y]) => y === 400).map(([x]) => x);
    const [rl, rr] = [Math.min(...xs(CANYON.river.path)), Math.max(...xs(CANYON.river.path))];
    const [gl, gr] = [Math.min(...xs(CANYON.riverGlow.path)), Math.max(...xs(CANYON.riverGlow.path))];
    expect(gl).toBeLessThan(rl);
    expect(gr).toBeGreaterThan(rr);
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
