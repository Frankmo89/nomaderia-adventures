import { describe, expect, it } from "vitest";
import {
  SCENE_PALETTES,
  SCENE_TILES,
  landmarkGroundY,
  scenePhaseForHour,
  sceneTileMarkup,
  sceneTileUrls,
  treeHillY,
  type ScenePhase,
  type SceneLayer,
} from "./park-scene-tiles";

const LAYERS = Object.keys(SCENE_TILES) as SceneLayer[];
const PHASES = Object.keys(SCENE_PALETTES) as ScenePhase[];

describe("park scene tiles", () => {
  describe.each(PHASES)("%s palette", (phase) => {
    const markup = sceneTileMarkup(SCENE_PALETTES[phase]);

    it.each(LAYERS)("%s is a well-formed SVG at its tile size", (layer) => {
      const { width, height } = SCENE_TILES[layer];
      const doc = new DOMParser().parseFromString(markup[layer], "image/svg+xml");
      expect(doc.getElementsByTagName("parsererror")).toHaveLength(0);
      const root = doc.documentElement;
      expect(root.getAttribute("width")).toBe(String(width));
      expect(root.getAttribute("height")).toBe(String(height));
      expect(root.getAttribute("viewBox")).toBe(`0 0 ${width} ${height}`);
      expect(markup[layer]).not.toMatch(/NaN|undefined|null|Infinity/);
    });

    it("stays small: all tiles under 45 KB", () => {
      const bytes = LAYERS.reduce((sum, layer) => sum + markup[layer].length, 0);
      expect(bytes).toBeLessThan(45_000);
    });

    it("never uses the home-hero amber or terracotta", () => {
      const all = JSON.stringify(SCENE_PALETTES[phase]) + Object.values(markup).join("");
      expect(all.toUpperCase()).not.toMatch(/#D97706|#C2562F/);
    });
  });

  it("draws the same forest and ridge on every load", () => {
    expect(sceneTileMarkup(SCENE_PALETTES.night)).toEqual(sceneTileMarkup(SCENE_PALETTES.night));
  });

  it("joins the ground lines without a step at the tile seam", () => {
    expect(treeHillY(SCENE_TILES.trees.width)).toBeCloseTo(treeHillY(0), 6);
    expect(landmarkGroundY(SCENE_TILES.landmarks.width)).toBeCloseTo(landmarkGroundY(0), 6);
  });

  it("lights the lighthouse only when its palette has a lamp", () => {
    expect(sceneTileMarkup(SCENE_PALETTES.night).landmarks).toContain(SCENE_PALETTES.night.lamp);
    expect(sceneTileMarkup(SCENE_PALETTES.day).landmarks).not.toMatch(/<circle cx="4338"/);
  });

  it("exposes each tile as a CSS url()", () => {
    const urls = sceneTileUrls(SCENE_PALETTES.day);
    for (const layer of LAYERS) expect(urls[layer]).toMatch(/^url\("data:image\/svg\+xml,%3Csvg/);
  });
});

describe("scenePhaseForHour", () => {
  it.each([
    [0, "night"], [5, "night"], [6, "dawn"], [8, "dawn"], [9, "day"],
    [16, "day"], [17, "dusk"], [19, "dusk"], [20, "night"], [23, "night"],
  ] as const)("%i h → %s", (hour, phase) => {
    expect(scenePhaseForHour(hour)).toBe(phase);
  });
});
