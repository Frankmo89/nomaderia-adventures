/**
 * Artwork for the /destinos header scene (ADR-043): a hiker walks along a
 * ridge while park landmarks drift past in layers. Each layer is one SVG tile
 * that repeats left to right; ParkTrailScene shows it as a CSS background and
 * slides it by one tile per loop, so the seam never shows.
 *
 * Every tile is plain markup built once at import (no network, ~22 KB in all).
 * Colors are brand greens (design-system §1); no amber, which belongs to the
 * home hero only.
 */

export const SCENE_COLORS = {
  far: "#3A6E55",
  snow: "#7FAE95",
  landmarks: "#22473A",
  trees: "#16332A",
  ridge: "#0D1A14",
  steam: "#EAF0EC",
} as const;

/** Tile sizes in SVG units; width / height is each layer's repeat ratio. */
export const SCENE_TILES = {
  far: { width: 4800, height: 300 },
  landmarks: { width: 3200, height: 300 },
  trees: { width: 2400, height: 160 },
  ridge: { width: 2400, height: 60 },
} as const;

export type SceneLayer = keyof typeof SCENE_TILES;

const C = SCENE_COLORS;
const round = (n: number) => Math.round(n * 10) / 10;

/** Small seeded PRNG (mulberry32) so the forest is the same on every load. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function svg(layer: SceneLayer, body: string): string {
  const { width, height } = SCENE_TILES[layer];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
}

/** Distant ranges: Mount Rainier, the Tetons and a second snowy peak. */
function farTile(): string {
  const range =
    "M0,196 C80,188 160,176 240,180 C320,184 380,170 450,150 C520,126 600,80 660,58 C690,48 710,48 740,58 C800,82 880,128 950,150 C1020,170 1100,176 1180,172 C1260,168 1320,180 1400,170 C1450,150 1480,120 1510,100 L1540,118 L1570,74 L1600,108 L1625,92 L1660,130 L1690,112 L1730,150 C1780,168 1840,176 1900,170 C1980,162 2060,150 2140,136 C2200,126 2240,118 2280,124 C2330,132 2380,150 2440,156 C2520,164 2600,150 2680,140 L2720,128 L2760,138 L2800,122 L2850,140 C2920,160 3000,172 3080,166 C3160,160 3220,178 3300,182 C3380,186 3440,170 3520,140 C3580,116 3640,100 3690,104 C3740,108 3790,130 3850,150 C3920,172 4000,180 4080,178 C4160,176 4240,168 4320,176 C4400,184 4480,192 4560,190 C4660,188 4740,194 4800,196 L4800,300 L0,300 Z";
  const snow = [
    "M618,84 C642,64 676,49 700,49 C722,49 746,60 768,76 L752,80 L738,72 L720,86 L702,75 L684,88 L664,80 L642,93 Z",
    "M1556,94 L1570,75 L1583,94 L1574,90 L1566,99 Z",
    "M1518,104 L1510,101 L1530,112 Z",
    "M1615,99 L1625,93 L1638,106 L1628,103 Z",
    "M3620,110 C3650,100 3672,98 3690,102 C3714,106 3736,116 3754,126 L3736,126 L3722,118 L3706,128 L3690,118 L3672,130 L3654,120 L3636,128 Z",
  ];
  return svg(
    "far",
    `<path fill="${C.far}" d="${range}"/>${snow.map((d) => `<path fill="${C.snow}" d="${d}"/>`).join("")}`,
  );
}

/** A spiky leaf cluster at the end of a Joshua tree branch. */
function spiky(cx: number, cy: number, r: number, points: number, rot: number): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = rot + (i * Math.PI) / points;
    const rr = i % 2 ? r * 0.42 : r;
    pts.push(`${round(cx + rr * Math.cos(a))},${round(cy + rr * Math.sin(a))}`);
  }
  return `<polygon points="${pts.join(" ")}"/>`;
}

/** A Bryce hoodoo: a column with a narrow neck and a wider cap rock. */
function hoodoo(x: number, base: number, h: number, w: number): string {
  const neck = w * 0.55;
  const cap = w * 0.85;
  const top = base - h;
  return `<path d="M${x - w / 2},${base} C${x - w / 2 + 2},${base - h * 0.4} ${x - neck / 2 - 3},${base - h * 0.55} ${x - neck / 2},${top + 14} L${x - cap / 2},${top + 8} C${x - cap / 2},${top} ${x + cap / 2},${top} ${x + cap / 2},${top + 8} L${x + neck / 2},${top + 14} C${x + neck / 2 + 3},${base - h * 0.55} ${x + w / 2 - 2},${base - h * 0.4} ${x + w / 2},${base} Z"/>`;
}

/** A giant sequoia: thick straight trunk, narrow clumpy crown up high. */
function sequoia(x: number, base: number, h: number, trunk: number): string {
  const top = base - h;
  const crownBase = base - h * 0.5;
  const cw = trunk * 1.25;
  const parts = [
    `<path d="M${x - trunk / 2},${base} C${x - trunk * 0.32},${base - h * 0.2} ${x - trunk * 0.24},${crownBase} ${x - trunk * 0.2},${crownBase} L${x + trunk * 0.2},${crownBase} C${x + trunk * 0.24},${crownBase} ${x + trunk * 0.32},${base - h * 0.2} ${x + trunk / 2},${base} Z"/>`,
  ];
  const clumps = 6;
  for (let i = 0; i < clumps; i++) {
    const t = i / (clumps - 1);
    const cy = crownBase - t * (crownBase - top - cw * 0.35);
    const spread = cw * (1 - t * 0.55);
    const side = i % 2 ? 1 : -1;
    parts.push(
      `<ellipse cx="${round(x + side * spread * 0.28)}" cy="${round(cy)}" rx="${round(spread * 0.62)}" ry="${round(cw * 0.42)}"/>`,
      `<ellipse cx="${round(x - side * spread * 0.18)}" cy="${round(cy - cw * 0.22)}" rx="${round(spread * 0.5)}" ry="${round(cw * 0.36)}"/>`,
    );
  }
  parts.push(
    `<path fill="none" stroke="${C.landmarks}" stroke-width="${round(trunk * 0.12)}" stroke-linecap="round" d="M${x},${round(crownBase + h * 0.06)} L${round(x - cw * 0.9)},${round(crownBase - h * 0.02)} M${x},${round(crownBase + h * 0.12)} L${round(x + cw * 0.8)},${round(crownBase + h * 0.04)}"/>`,
  );
  return parts.join("");
}

function joshuaTrees(): string {
  const limbs = [
    `<path fill="none" stroke-width="9" d="M1540,264 L1540,206"/>`,
    `<path fill="none" stroke-width="6" d="M1540,210 Q1520,196 1508,166 M1540,206 Q1562,196 1572,168 M1540,210 Q1546,180 1541,152 M1520,192 Q1500,190 1488,178"/>`,
    `<path fill="none" stroke-width="7" d="M1664,264 L1664,226"/>`,
    `<path fill="none" stroke-width="5" d="M1664,230 Q1650,220 1646,200 M1664,228 Q1680,222 1682,206 M1664,230 Q1667,212 1664,194"/>`,
  ];
  const tufts: [number, number, number, number][] = [
    [1507, 158, 15, 0.2], [1573, 160, 15, 0.6], [1541, 143, 16, 0.1], [1486, 171, 12, 0.4],
    [1645, 193, 12, 0.3], [1683, 199, 11, 0.7], [1664, 187, 12, 0.05],
  ];
  return (
    `<g stroke="${C.landmarks}" stroke-linecap="round" stroke-linejoin="round">${limbs.join("")}</g>` +
    tufts.map(([cx, cy, r, rot]) => spiky(cx, cy, r, 11, rot)).join("")
  );
}

/** Park landmarks, left to right, on a gently rolling ground line. */
function landmarksTile(): string {
  const { width } = SCENE_TILES.landmarks;
  const g: string[] = [];
  const at = (dx: number, body: string) => g.push(dx ? `<g transform="translate(${dx} 0)">${body}</g>` : body);

  const ground: string[] = [];
  for (let x = 0; x <= width; x += 25) {
    ground.push(`${x},${round(262 + 3 * Math.sin((2 * Math.PI * x) / 800) + 2 * Math.sin((2 * Math.PI * x) / 320))}`);
  }
  g.push(`<polygon points="0,300 ${ground.join(" ")} ${width},300"/>`);

  // Yosemite: Half Dome, rounded back and sheer face.
  at(0, `<path d="M60,264 C120,242 168,216 206,182 C236,152 258,112 282,86 C302,64 324,55 345,57 C358,58 366,63 370,71 L373,108 L377,166 C379,184 384,196 394,206 C424,226 474,242 560,264 Z"/>`);
  // Sequoia: three giant sequoias.
  at(0, sequoia(700, 266, 214, 36) + sequoia(762, 266, 168, 28) + sequoia(812, 266, 120, 22));
  // Grand Canyon: a flat-topped mesa and a temple butte.
  at(40, `<path d="M872,264 L884,246 L902,243 L908,226 L924,223 L930,204 L944,201 L950,176 L1060,174 L1066,198 L1084,201 L1090,222 L1112,226 L1118,244 L1140,248 L1150,264 Z"/><path d="M1132,264 L1140,250 L1152,247 L1158,232 L1166,229 L1172,212 L1180,208 L1188,186 L1196,208 L1204,212 L1210,230 L1218,233 L1224,248 L1236,252 L1240,264 Z"/>`);
  // Arches: Delicate Arch on slickrock, then Balanced Rock.
  at(80, `<path fill-rule="evenodd" d="M1296,252 C1292,236 1290,214 1286,190 C1282,164 1290,136 1306,121 C1318,110 1336,106 1352,110 C1372,116 1386,134 1392,160 C1398,188 1404,222 1408,252 Z M1305,252 C1306,232 1302,210 1300,188 C1298,164 1306,146 1318,138 C1330,131 1344,132 1354,140 C1366,150 1372,170 1374,196 C1376,220 1378,238 1380,252 Z"/><path d="M1262,266 C1290,251 1316,248 1346,249 C1380,250 1410,255 1446,266 Z"/>`);
  at(1600, `<path d="M0,266 C14,256 28,252 44,252 C60,252 76,256 92,266 Z"/><path d="M36,254 C38,240 38,228 40,222 L50,222 C52,230 52,242 56,254 Z"/><ellipse cx="45" cy="210" rx="25" ry="15"/>`);
  // Joshua Tree.
  at(260, joshuaTrees());
  // Saguaro: two saguaro cacti.
  at(300, `<g fill="none" stroke="${C.landmarks}" stroke-linecap="round" stroke-linejoin="round"><path stroke-width="22" d="M1830,264 L1830,128"/><path stroke-width="14" d="M1830,206 L1812,206 Q1805,206 1805,198 L1805,164 M1830,190 L1850,190 Q1857,190 1857,183 L1857,148"/><path stroke-width="14" d="M1886,264 L1886,214"/><path stroke-width="9" d="M1886,240 L1875,240 Q1870,240 1870,234 L1870,222"/></g>`);
  // Bryce Canyon: hoodoos.
  const hoodoos: [number, number, number][] = [[1972, 92, 26], [2002, 124, 30], [2034, 74, 22], [2066, 108, 28], [2098, 62, 20], [2124, 86, 24]];
  at(330, `<path d="M1940,264 L1952,236 L2150,238 L2166,264 Z"/>` + hoodoos.map(([x, h, w]) => hoodoo(x, 240, h, w)).join(""));
  // Death Valley: Mesquite dunes.
  at(2560, `<path d="M0,266 C30,252 60,234 90,227 L97,228 C120,241 150,252 172,257 C192,247 222,237 242,235 L247,236 C266,247 284,257 304,266 Z"/>`);
  // Yellowstone: Old Faithful (cone and steam) and a bison.
  at(660, `<path d="M2218,266 C2256,248 2298,245 2336,247 C2358,250 2370,256 2384,266 Z"/><path fill="${C.steam}" fill-opacity="0.16" filter="url(#steam)" d="M2292,248 C2288,222 2283,200 2290,182 C2276,172 2278,150 2293,141 C2283,125 2291,100 2307,96 C2301,80 2313,60 2331,62 C2347,55 2363,68 2357,84 C2371,92 2369,112 2353,118 C2363,130 2357,152 2339,154 C2343,175 2331,195 2319,200 C2317,220 2313,236 2311,248 Z"/>`);
  at(3080, `<path d="M4,247 C2,241 6,235 12,234 C16,225 24,218 32,219 C42,220 52,225 62,227 C70,228 76,231 78,237 L80,247 L77,241 C76,247 74,251 70,253 L69,265 L64,265 L63,255 L58,255 L57,265 L52,265 L52,254 C44,255 36,255 30,254 L28,265 L23,265 L22,254 L20,265 L15,265 L15,255 C12,257 10,259 8,257 C6,255 4,253 4,247 Z"/><path fill="none" stroke="${C.landmarks}" stroke-width="2" stroke-linecap="round" d="M11,235 Q7,230 10,227"/>`);

  return svg(
    "landmarks",
    `<defs><filter id="steam" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter></defs><g fill="${C.landmarks}">${g.join("")}</g>`,
  );
}

/** Ground height of the forest hill; periodic over the 2400-unit tile. */
export const treeHillY = (x: number) =>
  116 + 6 * Math.sin((2 * Math.PI * x) / 800) + 4 * Math.sin((2 * Math.PI * x) / 300 + 1);

function pine(x: number, base: number, h: number, w: number): string {
  const p = (dx: number, dy: number) => `${round(x + dx * w)},${round(base - dy * h)}`;
  const pts = [
    p(0, 1), p(0.2, 0.7), p(0.1, 0.7), p(0.34, 0.42), p(0.2, 0.42), p(0.5, 0.12), p(0.06, 0.12), p(0.06, 0),
    p(-0.06, 0), p(-0.06, 0.12), p(-0.5, 0.12), p(-0.2, 0.42), p(-0.34, 0.42), p(-0.1, 0.7), p(-0.2, 0.7),
  ];
  return `<polygon points="${pts.join(" ")}"/>`;
}

/** Pine forest in clusters with clearings, on a rolling hill. */
function treesTile(): string {
  const { width, height } = SCENE_TILES.trees;
  const rand = seeded(7);
  const hill: string[] = [];
  for (let x = 0; x <= width; x += 20) hill.push(`${x},${round(treeHillY(x))}`);
  const g = [`<polygon points="0,${height} ${hill.join(" ")} ${width},${height}"/>`];
  let x = 30;
  while (x < width - 30) {
    const cluster = 2 + Math.floor(rand() * 5);
    for (let i = 0; i < cluster && x < width - 30; i++) {
      const h = 34 + rand() * 50;
      g.push(pine(x, treeHillY(x) + 4, h, h * (0.42 + rand() * 0.1)));
      x += 12 + rand() * 18;
    }
    x += 60 + rand() * 170;
  }
  return svg("trees", `<g fill="${C.trees}">${g.join("")}</g>`);
}

/** The ridge the hiker walks on: crest near y=16, with tufts, stones and cairns. */
function ridgeTile(): string {
  const { width, height } = SCENE_TILES.ridge;
  const rand = seeded(11);
  const g = [`<path d="M0,16 C300,14 600,18 900,16 C1200,14 1500,18 1800,16 C2000,15 2200,17 ${width},16 L${width},${height} L0,${height} Z"/>`];
  for (let x = 40; x < width - 40; x += 70 + rand() * 160) {
    const kind = rand();
    if (kind < 0.45) {
      const s = 4 + rand() * 4;
      g.push(`<path d="M${round(x - s)},17 L${round(x - s * 0.6)},${round(16 - s * 1.4)} L${round(x - s * 0.2)},16 L${round(x)},${round(16 - s * 1.9)} L${round(x + s * 0.3)},16 L${round(x + s * 0.7)},${round(16 - s * 1.3)} L${round(x + s)},17 Z"/>`);
    } else if (kind < 0.85) {
      const w = 6 + rand() * 12;
      const h = 3 + rand() * 5;
      g.push(`<ellipse cx="${round(x)}" cy="16.5" rx="${round(w / 2)}" ry="${round(h)}"/>`);
    } else {
      g.push(`<ellipse cx="${round(x)}" cy="14" rx="9" ry="4"/><ellipse cx="${round(x + 1)}" cy="8.5" rx="6.5" ry="3.5"/><ellipse cx="${round(x)}" cy="4" rx="4" ry="2.6"/>`);
    }
  }
  return svg("ridge", `<g fill="${C.ridge}">${g.join("")}</g>`);
}

const toCssUrl = (markup: string) => `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;

/** Each layer's tile as a CSS `url(...)` value, built once. */
export const SCENE_TILE_URLS: Record<SceneLayer, string> = {
  far: toCssUrl(farTile()),
  landmarks: toCssUrl(landmarksTile()),
  trees: toCssUrl(treesTile()),
  ridge: toCssUrl(ridgeTile()),
};

/** Raw markup, for tests and for previewing a tile on its own. */
export const sceneTileMarkup = (): Record<SceneLayer, string> => ({
  far: farTile(),
  landmarks: landmarksTile(),
  trees: treesTile(),
  ridge: ridgeTile(),
});
