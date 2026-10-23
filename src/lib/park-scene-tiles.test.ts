import { describe, expect, it } from "vitest";
import { SCENE_TILES, SCENE_TILE_URLS, sceneTileMarkup, treeHillY, type SceneLayer } from "./park-scene-tiles";

const LAYERS = Object.keys(SCENE_TILES) as SceneLayer[];

describe("park scene tiles", () => {
  const markup = sceneTileMarkup();

  it.each(LAYERS)("%s is a well-formed SVG at its tile size", (layer) => {
    const { width, height } = SCENE_TILES[layer];
    const doc = new DOMParser().parseFromString(markup[layer], "image/svg+xml");
    expect(doc.getElementsByTagName("parsererror")).toHaveLength(0);
    const root = doc.documentElement;
    expect(root.getAttribute("width")).toBe(String(width));
    expect(root.getAttribute("height")).toBe(String(height));
    expect(root.getAttribute("viewBox")).toBe(`0 0 ${width} ${height}`);
    expect(markup[layer]).not.toMatch(/NaN|undefined|Infinity/);
  });

  it("draws the same forest and ridge on every load", () => {
    expect(sceneTileMarkup()).toEqual(markup);
  });

  it("joins the forest hill without a step at the tile seam", () => {
    expect(treeHillY(SCENE_TILES.trees.width)).toBeCloseTo(treeHillY(0), 6);
  });

  it("stays small: all tiles under 30 KB", () => {
    const bytes = LAYERS.reduce((sum, layer) => sum + markup[layer].length, 0);
    expect(bytes).toBeLessThan(30_000);
  });

  it("exposes each tile as a CSS url()", () => {
    for (const layer of LAYERS) expect(SCENE_TILE_URLS[layer]).toMatch(/^url\("data:image\/svg\+xml,%3Csvg/);
  });
});
