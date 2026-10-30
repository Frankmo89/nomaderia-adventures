import { describe, expect, it } from "vitest";
import { SCENE_PALETTES, sceneTileMarkup } from "@/lib/park-scene-tiles";
import {
  LANDMARK_ART,
  LANDMARK_SLUGS,
  groupScale,
  landmarkAspect,
  landmarkForSlug,
  landmarkMarkup,
  landmarkUrl,
  walkSeconds,
  type LandmarkId,
} from "@/lib/calculator-scene";

const IDS = Object.keys(LANDMARK_ART) as LandmarkId[];

describe("landmarkForSlug", () => {
  it("covers all 63 published parks", () => {
    expect(LANDMARK_SLUGS).toHaveLength(63);
    expect(new Set(LANDMARK_SLUGS).size).toBe(63);
  });

  it("gives the parks with their own art their own landmark", () => {
    expect(landmarkForSlug("yosemite-national-park")).toBe("half-dome");
    expect(landmarkForSlug("joshua-tree-national-park")).toBe("joshua-tree");
    expect(landmarkForSlug("channel-islands-national-park")).toBe("arch-rock");
    expect(landmarkForSlug("grand-canyon-national-park")).toBe("mesa");
    expect(landmarkForSlug("mount-rainier-national-park")).toBe("rainier");
    expect(landmarkForSlug("gateway-arch-national-park")).toBe("gateway-arch");
  });

  it("falls back to a snowy peak for an unknown or missing slug", () => {
    expect(landmarkForSlug("parque-nuevo")).toBe("peak");
    expect(landmarkForSlug(null)).toBe("peak");
  });
});

describe("landmark art", () => {
  it("every crop stays inside its tile", () => {
    for (const id of IDS) {
      const art = LANDMARK_ART[id];
      if (art.kind !== "tile") continue;
      const tile = art.layer === "far" ? { w: 4800, h: 300 } : { w: 5800, h: 300 };
      expect(art.x0, id).toBeGreaterThanOrEqual(0);
      expect(art.x1, id).toBeLessThanOrEqual(tile.w);
      expect(art.x1, id).toBeGreaterThan(art.x0);
      expect(art.bottom, id).toBeLessThanOrEqual(tile.h);
      expect(art.bottom, id).toBeGreaterThan(art.top);
    }
  });

  it("builds one standalone SVG per landmark, without the tile's mist band", () => {
    for (const id of IDS) {
      const svg = landmarkMarkup(id, SCENE_PALETTES.night);
      expect(svg.startsWith("<svg"), id).toBe(true);
      expect(svg, id).toContain('preserveAspectRatio="xMidYMax meet"');
      expect(svg, id).not.toContain('id="hz"');
      // The root has no fixed size, so the <img> box decides it.
      expect(svg.slice(0, svg.indexOf(">")), id).not.toMatch(/width=|height=/);
      expect(landmarkUrl(id, SCENE_PALETTES.night).startsWith("data:image/svg+xml,")).toBe(true);
      expect(landmarkAspect(id), id).toBeGreaterThan(0.3);
    }
  });

  it("crops Half Dome out of the same tile /destinos draws", () => {
    const tile = sceneTileMarkup(SCENE_PALETTES.night).landmarks;
    const svg = landmarkMarkup("half-dome", SCENE_PALETTES.night);
    expect(svg).toContain('viewBox="50 46 520 228"');
    // Same shapes, only the frame changes.
    expect(svg).toContain(tile.slice(tile.indexOf("<defs>"), tile.indexOf("<defs>") + 120));
  });

  it("draws a far-range peak in the landmark color, not the paler far color", () => {
    const C = SCENE_PALETTES.night;
    const svg = landmarkMarkup("rainier", C);
    expect(svg).toContain(`fill="${C.landmarks}"`);
    expect(svg).not.toContain(`fill="${C.far}"`);
  });

  it("never paints in brand amber or terracotta", () => {
    for (const phase of Object.values(SCENE_PALETTES)) {
      for (const id of IDS) {
        const svg = landmarkMarkup(id, phase).toUpperCase();
        expect(svg, id).not.toContain("#D97706");
        expect(svg, id).not.toContain("#C2562F");
      }
    }
  });
});

describe("the walking group", () => {
  it("mixes grown-ups and kids and repeats after eight", () => {
    const scales = Array.from({ length: 8 }, (_, i) => groupScale(i));
    expect(scales[0]).toBe(1);
    expect(Math.min(...scales)).toBeLessThan(0.8);
    expect(groupScale(8)).toBe(groupScale(0));
  });

  it("walks at the /destinos hiker's pace, scaled to height", () => {
    // 50 px hiker covers 1280 px in 30.4 s (ADR-043).
    expect(walkSeconds(1280, 50)).toBeCloseTo(30.4, 5);
    // Half as tall → half the speed → twice the time.
    expect(walkSeconds(1280, 25)).toBeCloseTo(60.8, 5);
    expect(walkSeconds(-10, 40)).toBe(0);
  });
});
