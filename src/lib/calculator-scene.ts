/**
 * Artwork for the calculator (ADR-061): the chosen park's landmark, cut out
 * of the same SVG tiles the /destinos scene draws (ADR-043), so the two pages
 * share one set of shapes and no new art ships.
 *
 * A landmark is a crop: the whole tile is built for one palette, then its
 * viewBox is narrowed to the shape. Parks without their own shape get the
 * nearest kind of scenery (dunes, mesa, pines, a snowy peak…). It is
 * decoration, never a claim about the park, so a near match is fine.
 */
import { pine, sceneTileMarkup, type ScenePalette } from "@/lib/park-scene-tiles";

export type LandmarkId =
  | "half-dome"
  | "sequoias"
  | "mesa"
  | "arches"
  | "joshua-tree"
  | "saguaro"
  | "hoodoos"
  | "dunes"
  | "old-faithful"
  | "bison"
  | "watchman"
  | "sea-stacks"
  | "arch-rock"
  | "lighthouse"
  | "palms"
  | "elk"
  | "volcano"
  | "cliff-palace"
  | "rainier"
  | "tetons"
  | "peak"
  | "pines"
  | "gateway-arch";

interface TileCrop {
  kind: "tile";
  layer: "landmarks" | "far";
  x0: number;
  x1: number;
  top: number;
  bottom: number;
}

interface CustomShape {
  kind: "custom";
  width: number;
  height: number;
  draw: (C: ScenePalette) => string;
}

type LandmarkArt = TileCrop | CustomShape;

const crop = (layer: TileCrop["layer"], x0: number, x1: number, top: number, bottom = 274): TileCrop => ({
  kind: "tile",
  layer,
  x0,
  x1,
  top,
  bottom,
});

/** A small stand of pines on a hill: forests of the east and the north woods. */
function pinesShape(C: ScenePalette): string {
  const hill = "M0,150 C40,128 80,120 130,121 C180,122 220,130 260,150 L260,170 L0,170 Z";
  const trees: [number, number, number][] = [
    [34, 70, 30], [62, 104, 44], [92, 84, 36], [128, 118, 50], [162, 92, 40], [196, 108, 46], [226, 74, 32],
  ];
  const base = (x: number) => 150 - 28 * Math.sin((Math.PI * x) / 260);
  return `<g fill="${C.landmarks}"><path d="${hill}"/>${trees.map(([x, h, w]) => pine(x, base(x) + 6, h, w)).join("")}</g>`;
}

/** Tall sand dunes with sharp crests (the tile's dunes are a low strip). */
function dunesShape(C: ScenePalette): string {
  const back =
    "M0,150 L0,104 C26,92 58,70 92,52 L99,53 C124,70 150,90 176,98 C198,82 226,62 254,56 L261,57 C276,72 290,88 300,98 L300,150 Z";
  const front = "M0,150 L0,128 C40,118 76,104 110,96 L116,97 C150,112 196,126 240,130 C262,132 284,136 300,140 L300,150 Z";
  const crests =
    "M92,52 C80,74 74,96 76,120 M254,56 C246,78 244,98 248,118 M110,96 C104,110 102,124 104,138";
  return `<g fill="${C.landmarks}"><path d="${back}"/><path fill-opacity="0.82" d="${front}"/></g><path fill="none" stroke="${C.accent}" stroke-opacity="0.22" stroke-width="2" stroke-linecap="round" d="${crests}"/>`;
}

/** The Gateway Arch over a strip of riverbank trees. */
function gatewayArchShape(C: ScenePalette): string {
  const arch =
    "M22,226 C34,150 64,46 110,38 C156,46 186,150 198,226 L186,226 C175,156 148,62 110,55 C72,62 45,156 34,226 Z";
  const bank = [12, 40, 70, 150, 178, 206]
    .map((x, i) => pine(x, 228, 20 + (i % 3) * 6, 12 + (i % 2) * 4))
    .join("");
  return `<g fill="${C.landmarks}"><path d="${arch}"/><rect x="0" y="224" width="220" height="16"/>${bank}</g>`;
}

/** Where each landmark sits in the 5800-wide landmarks tile (or 4800-wide far tile). */
export const LANDMARK_ART: Record<LandmarkId, LandmarkArt> = {
  "half-dome": crop("landmarks", 50, 570, 46),
  sequoias: crop("landmarks", 645, 850, 44),
  mesa: crop("landmarks", 900, 1290, 160),
  arches: crop("landmarks", 1335, 1700, 98),
  "joshua-tree": crop("landmarks", 1722, 1966, 120),
  saguaro: crop("landmarks", 2085, 2210, 110),
  hoodoos: crop("landmarks", 2262, 2504, 108),
  dunes: { kind: "custom", width: 300, height: 150, draw: dunesShape },
  "old-faithful": crop("landmarks", 2870, 3170, 50),
  bison: crop("landmarks", 3076, 3168, 210),
  watchman: crop("landmarks", 3572, 3824, 86),
  "sea-stacks": crop("landmarks", 3876, 4072, 154),
  "arch-rock": crop("landmarks", 4056, 4284, 200),
  lighthouse: crop("landmarks", 4270, 4470, 158),
  palms: crop("landmarks", 4515, 4720, 128),
  elk: crop("landmarks", 4782, 4904, 166),
  volcano: crop("landmarks", 4975, 5305, 112),
  "cliff-palace": crop("landmarks", 5332, 5598, 150),
  rainier: crop("far", 470, 930, 40, 220),
  tetons: crop("far", 1420, 1760, 64, 200),
  peak: crop("far", 3600, 3790, 94, 196),
  pines: { kind: "custom", width: 260, height: 170, draw: pinesShape },
  "gateway-arch": { kind: "custom", width: 220, height: 240, draw: gatewayArchShape },
};

/**
 * Every published park (63) and its shape. Exact landmarks where the
 * /destinos art has one; otherwise the closest scenery.
 */
const PARK_LANDMARKS: Record<string, LandmarkId> = {
  "acadia-national-park": "lighthouse",
  "arches-national-park": "arches",
  "badlands-national-park": "hoodoos",
  "big-bend-national-park": "mesa",
  "biscayne-national-park": "palms",
  "black-canyon-of-the-gunnison-national-park": "mesa",
  "bryce-canyon-national-park": "hoodoos",
  "canyonlands-national-park": "mesa",
  "capitol-reef-national-park": "mesa",
  "carlsbad-caverns-national-park": "mesa",
  "channel-islands-national-park": "arch-rock",
  "congaree-national-park": "pines",
  "crater-lake-national-park": "volcano",
  "cuyahoga-valley-national-park": "pines",
  "death-valley-national-park": "dunes",
  "denali-national-park-preserve": "peak",
  "dry-tortugas-national-park": "lighthouse",
  "everglades-national-park": "palms",
  "gates-of-the-arctic-national-park-preserve": "peak",
  "gateway-arch-national-park": "gateway-arch",
  "glacier-bay-national-park-preserve": "peak",
  "glacier-national-park": "peak",
  "grand-canyon-national-park": "mesa",
  "grand-teton-national-park": "tetons",
  "great-basin-national-park": "peak",
  "great-sand-dunes-national-park-preserve": "dunes",
  "great-smoky-mountains-national-park": "pines",
  "guadalupe-mountains-national-park": "mesa",
  "haleakala-national-park": "volcano",
  "hawaii-volcanoes-national-park": "volcano",
  "hot-springs-national-park": "pines",
  "indiana-dunes-national-park": "dunes",
  "isle-royale-national-park": "pines",
  "joshua-tree-national-park": "joshua-tree",
  "katmai-national-park-preserve": "peak",
  "kenai-fjords-national-park": "peak",
  "kings-canyon-national-park": "sequoias",
  "kobuk-valley-national-park": "dunes",
  "lake-clark-national-park-preserve": "peak",
  "lassen-volcanic-national-park": "volcano",
  "mammoth-cave-national-park": "pines",
  "mesa-verde-national-park": "cliff-palace",
  "mount-rainier-national-park": "rainier",
  "national-park-of-american-samoa": "palms",
  "new-river-gorge-national-park-preserve": "pines",
  "north-cascades-national-park": "peak",
  "olympic-national-park": "sea-stacks",
  "petrified-forest-national-park": "mesa",
  "pinnacles-national-park": "hoodoos",
  "redwood-national-park": "sequoias",
  "rocky-mountain-national-park": "elk",
  "saguaro-national-park": "saguaro",
  "sequoia-kings-canyon-national-parks": "sequoias",
  "shenandoah-national-park": "pines",
  "theodore-roosevelt-national-park": "bison",
  "virgin-islands-national-park": "palms",
  "voyageurs-national-park": "pines",
  "white-sands-national-park": "dunes",
  "wind-cave-national-park": "bison",
  "wrangell-st-elias-national-park-preserve": "peak",
  "yellowstone-national-park": "old-faithful",
  "yosemite-national-park": "half-dome",
  "zion-national-park": "watchman",
};

/** The shape for a park slug; a snowy peak for any park not listed. */
export function landmarkForSlug(slug: string | null | undefined): LandmarkId {
  return (slug && PARK_LANDMARKS[slug]) || "peak";
}

export const LANDMARK_SLUGS: readonly string[] = Object.keys(PARK_LANDMARKS);

/** Width ÷ height of a landmark's box. */
export function landmarkAspect(id: LandmarkId): number {
  const art = LANDMARK_ART[id];
  return art.kind === "tile" ? (art.x1 - art.x0) / (art.bottom - art.top) : art.width / art.height;
}

/** The mist band `haze()` adds to a tile in park-scene-tiles.ts. */
const HAZE = /<defs><linearGradient id="hz"[\s\S]*?<\/defs><rect [^>]*fill="url\(#hz\)"\/>/;

/** Standalone SVG markup for one landmark in one palette. */
export function landmarkMarkup(id: LandmarkId, palette: ScenePalette): string {
  const art = LANDMARK_ART[id];
  if (art.kind === "custom") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${art.width} ${art.height}" preserveAspectRatio="xMidYMax meet">${art.draw(palette)}</svg>`;
  }
  // The far ranges are drawn in a paler color for depth; as the subject they
  // take the landmark color.
  const C = art.layer === "far" ? { ...palette, far: palette.landmarks } : palette;
  const tile = sceneTileMarkup(C)[art.layer];
  const box = `viewBox="${art.x0} ${art.top} ${art.x1 - art.x0} ${art.bottom - art.top}" preserveAspectRatio="xMidYMax meet"`;
  // The tile's mist band runs edge to edge; cut out, it would show as a pale
  // box at the landmark's foot. A lone shape needs none.
  return tile.replace(/width="\d+" height="\d+" viewBox="[^"]*"/, box).replace(HAZE, "");
}


/** The landmark as an `<img src>` data URI. */
export function landmarkUrl(id: LandmarkId, palette: ScenePalette): string {
  return `data:image/svg+xml,${encodeURIComponent(landmarkMarkup(id, palette))}`;
}

/**
 * How tall each hiker in a group stands, as a share of the leader: a family
 * mixes grown-ups and kids, so the row never reads as clones.
 */
const GROUP_SCALES = [1, 0.92, 0.74, 0.96, 0.8, 0.88, 0.7, 0.94] as const;

export function groupScale(index: number): number {
  return GROUP_SCALES[index % GROUP_SCALES.length];
}

/**
 * Seconds for a hiker `heightPx` tall to cross `distancePx` without his boots
 * sliding. The /destinos hiker (50 px, 0.8 s step) covers 1280 px of ridge in
 * 30.4 s; speed scales with his height.
 */
export function walkSeconds(distancePx: number, heightPx: number): number {
  const pxPerSecond = (1280 / 30.4) * (heightPx / 50);
  return Math.max(distancePx, 0) / pxPerSecond;
}
