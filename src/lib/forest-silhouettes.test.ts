import { describe, expect, it } from "vitest";
import { FOREST, silhouetteMaskUrl } from "./forest-silhouettes";

const pairs = (path: string) => {
  const n = (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]);
  return out;
};

describe("forest silhouettes", () => {
  it.each(Object.entries(FOREST))("%s stays inside its box vertically", (_, s) => {
    const ys = pairs(s.path).map(([, y]) => y);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThanOrEqual(s.height);
  });

  it.each(["far", "mid", "near"] as const)("%s tiles sideways with no seam", (key) => {
    const s = FOREST[key];
    const pts = pairs(s.path);
    // The ground runs from x=0 to x=width at the same height…
    const ground = s.path.split(" Z")[0];
    const g = pairs(ground);
    expect(g[1][0]).toBe(0);
    expect(g[g.length - 2][0]).toBe(s.width);
    expect(g[1][1]).toBeCloseTo(g[g.length - 2][1], 0);
    // …and no tree reaches past either edge.
    for (const [x] of pts) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(s.width);
    }
  });

  it("builds an encoded CSS url", () => {
    const url = silhouetteMaskUrl(FOREST.side);
    expect(url.startsWith('url("data:image/svg+xml,')).toBe(true);
    expect(url).not.toMatch(/[<>]/);
    expect(decodeURIComponent(url)).toContain('viewBox="0 0 220 300"');
  });
});
