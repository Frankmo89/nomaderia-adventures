/**
 * Artwork for the /destinos header scene (ADR-043): a hiker walks along a
 * ridge while park landmarks drift past in layers. Each layer is one SVG tile
 * that repeats left to right; ParkTrailScene shows it as a CSS background and
 * slides it by one tile per loop, so the seam never shows.
 *
 * Tiles are plain markup built in the browser for one palette (no network,
 * ~35 KB). The palette follows the visitor's clock: dawn, day, dusk or night.
 * No brand amber (#D97706, home hero only) or terracotta in any of them.
 */

export type ScenePhase = "dawn" | "day" | "dusk" | "night";

export interface ScenePalette {
  /** Sky stops at 0, 38, 58, 82 and 100% height. Dark through 58% so the
   * white title, subtitle and navbar always read. */
  sky: readonly [string, string, string, string, string];
  glow: string;
  far: string;
  snow: string;
  landmarks: string;
  trees: string;
  ridge: string;
  /** Steam, waterfalls and wave glints. */
  accent: string;
  water: string;
  /** Lighthouse lamp; null when it is off (daytime). */
  lamp: string | null;
  orb: { color: string; glow: string; position: "high" | "low-left" | "low-right" };
  /** Star opacity; 0 hides them. */
  stars: number;
  /** Faint outline that keeps the hiker visible in front of dark pines. */
  rim: string;
  /** Low clouds behind the far ranges; null for none. */
  clouds: { color: string; opacity: number } | null;
  /** Darkening behind the title and subtitle, for skies too light to carry
   * white text on their own (day). "none" elsewhere. */
  scrim: string;
}

export const SCENE_PALETTES: Record<ScenePhase, ScenePalette> = {
  night: {
    sky: ["#14201A", "#182C22", "#21402F", "#4E8A6A", "#5E9C7A"],
    glow: "rgba(165,214,186,0.32)",
    far: "#3A6E55", snow: "#7FAE95", landmarks: "#22473A", trees: "#16332A", ridge: "#0D1A14",
    accent: "#EAF0EC", water: "#2E5B48", lamp: "#F4F1E8",
    orb: { color: "#F4F1E8", glow: "rgba(234,240,236,0.22)", position: "high" },
    stars: 0.55,
    rim: "rgba(120,175,145,0.55)",
    clouds: null,
    scrim: "none",
  },
  dawn: {
    sky: ["#16213A", "#22304F", "#33415F", "#C3928F", "#F0C8A6"],
    glow: "rgba(255,214,190,0.34)",
    far: "#5E7F86", snow: "#E7DCE0", landmarks: "#2F4A52", trees: "#223A42", ridge: "#121F26",
    accent: "#FFF4EC", water: "#7D8FA6", lamp: "#FFE9C7",
    orb: { color: "#FFE6C4", glow: "rgba(255,226,190,0.30)", position: "low-left" },
    stars: 0.25,
    rim: "rgba(240,200,180,0.5)",
    clouds: { color: "#FFE3D6", opacity: 0.4 },
    scrim: "none",
  },
  day: {
    sky: ["#2A6890", "#3478A0", "#4A8DB4", "#9CCDE2", "#CDE8F1"],
    glow: "rgba(255,255,255,0.28)",
    far: "#6E9B94", snow: "#F1F7F6", landmarks: "#2F5E4A", trees: "#224A39", ridge: "#132A1E",
    accent: "#FFFFFF", water: "#4F8FA8", lamp: null,
    orb: { color: "#FFF7DE", glow: "rgba(255,244,214,0.32)", position: "high" },
    stars: 0,
    rim: "rgba(220,240,245,0.5)",
    clouds: { color: "#FFFFFF", opacity: 0.6 },
    scrim: "radial-gradient(ellipse 95% 50% at 50% 46%, rgba(12,38,56,0.62) 0%, rgba(12,38,56,0.5) 50%, transparent 85%)",
  },
  dusk: {
    sky: ["#191B32", "#282947", "#3D3555", "#CC7D66", "#F2B577"],
    glow: "rgba(255,196,150,0.34)",
    far: "#7A5F75", snow: "#F2D2C2", landmarks: "#45324B", trees: "#31243A", ridge: "#170F1D",
    accent: "#FFEADD", water: "#A97B8E", lamp: "#FFE0A8",
    orb: { color: "#FFD9A3", glow: "rgba(255,210,160,0.30)", position: "low-right" },
    stars: 0.18,
    rim: "rgba(255,200,170,0.5)",
    clouds: { color: "#FFD6C2", opacity: 0.35 },
    scrim: "none",
  },
};

/**
 * Phase for a local hour (0–23). Fixed windows, not real sunrise times:
 * dawn 6–8, day 9–16, dusk 17–19, night 20–5.
 */
export function scenePhaseForHour(hour: number): ScenePhase {
  if (hour >= 6 && hour < 9) return "dawn";
  if (hour >= 9 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

const PHASE_PARAM: Record<string, ScenePhase> = {
  amanecer: "dawn",
  dia: "day",
  atardecer: "dusk",
  noche: "night",
};

/**
 * The visitor's phase from their clock. For previews,
 * `?escena=amanecer|dia|atardecer|noche` forces one.
 */
export function currentScenePhase(): ScenePhase {
  try {
    const forced = new URLSearchParams(window.location.search).get("escena");
    if (forced && PHASE_PARAM[forced]) return PHASE_PARAM[forced];
  } catch {
    // No URL access: fall back to the clock.
  }
  return scenePhaseForHour(new Date().getHours());
}

/** Tile sizes in SVG units; width / height is each layer's repeat ratio. */
export const SCENE_TILES = {
  clouds: { width: 2400, height: 60 },
  far: { width: 4800, height: 300 },
  landmarks: { width: 5800, height: 300 },
  trees: { width: 2400, height: 160 },
  ridge: { width: 2400, height: 60 },
} as const;

export type SceneLayer = keyof typeof SCENE_TILES;

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

/** Low cloud banks: puffs with flat bottoms, clear of the tile edges. */
function cloudsTile(C: ScenePalette): string {
  if (!C.clouds) return svg("clouds", "");
  const puffs: [number, number][] = [[160, 1.0], [620, 0.7], [1040, 1.2], [1480, 0.8], [1900, 1.0], [2220, 0.6]];
  const body = puffs
    .map(([x, k]) => {
      const e = (dx: number, dy: number, rx: number, ry: number) =>
        `<ellipse cx="${round(x + dx * k)}" cy="${round(50 - dy * k)}" rx="${round(rx * k)}" ry="${round(ry * k)}"/>`;
      return e(0, 0, 70, 12) + e(-30, 10, 30, 18) + e(6, 16, 34, 24) + e(40, 8, 26, 16);
    })
    .join("");
  return svg("clouds", `<g fill="${C.clouds.color}" fill-opacity="${C.clouds.opacity}"><clipPath id="c"><rect width="2400" height="52"/></clipPath><g clip-path="url(#c)">${body}</g></g>`);
}

/**
 * Mist at the foot of a layer: a band that fades in toward the base, in the
 * sky's horizon color, so each layer parts from the next like hills in haze.
 */
function haze(C: ScenePalette, layer: SceneLayer, from: number, to: number, opacity: number): string {
  const { width, height } = SCENE_TILES[layer];
  // Full strength from `to` down to the tile's base, so no edge shows.
  const full = ((to - from) / (height - from)).toFixed(2);
  return `<defs><linearGradient id="hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.sky[3]}" stop-opacity="0"/><stop offset="${full}" stop-color="${C.sky[3]}" stop-opacity="${opacity}"/><stop offset="1" stop-color="${C.sky[3]}" stop-opacity="${opacity}"/></linearGradient></defs><rect x="0" y="${from}" width="${width}" height="${height - from}" fill="url(#hz)"/>`;
}

/** Distant ranges: Mount Rainier, the Tetons and a second snowy peak. */
function farTile(C: ScenePalette): string {
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
    `<path fill="${C.far}" d="${range}"/>${snow.map((d) => `<path fill="${C.snow}" d="${d}"/>`).join("")}${haze(C, "far", 120, 232, 0.5)}`,
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
function sequoia(C: ScenePalette, x: number, base: number, h: number, trunk: number): string {
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

function joshuaTrees(C: ScenePalette): string {
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

/** Ground line of the landmark strip; periodic over the tile width. */
export const landmarkGroundY = (x: number) =>
  262 + 3 * Math.sin((2 * Math.PI * x) / 725) + 2 * Math.sin((2 * Math.PI * x) / 290);

/** Park landmarks, left to right, on a gently rolling ground line. */
function landmarksTile(C: ScenePalette): string {
  const { width } = SCENE_TILES.landmarks;
  const g: string[] = [];
  const at = (dx: number, body: string) => g.push(dx ? `<g transform="translate(${dx} 0)">${body}</g>` : body);

  const ground: string[] = [];
  for (let x = 0; x <= width; x += 25) {
    ground.push(`${x},${round(landmarkGroundY(x))}`);
  }
  g.push(`<polygon points="0,300 ${ground.join(" ")} ${width},300"/>`);

  // Yosemite: Half Dome, rounded back and sheer face.
  at(0, `<path d="M60,264 C120,242 168,216 206,182 C236,152 258,112 282,86 C302,64 324,55 345,57 C358,58 366,63 370,71 L373,108 L377,166 C379,184 384,196 394,206 C424,226 474,242 560,264 Z"/>`);
  // Sequoia: three giant sequoias.
  at(0, sequoia(C, 700, 266, 214, 36) + sequoia(C, 762, 266, 168, 28) + sequoia(C, 812, 266, 120, 22));
  // Grand Canyon: a flat-topped mesa and a temple butte.
  at(40, `<path d="M872,264 L884,246 L902,243 L908,226 L924,223 L930,204 L944,201 L950,176 L1060,174 L1066,198 L1084,201 L1090,222 L1112,226 L1118,244 L1140,248 L1150,264 Z"/><path d="M1132,264 L1140,250 L1152,247 L1158,232 L1166,229 L1172,212 L1180,208 L1188,186 L1196,208 L1204,212 L1210,230 L1218,233 L1224,248 L1236,252 L1240,264 Z"/>`);
  // Arches: Delicate Arch on slickrock, then Balanced Rock.
  at(80, `<path fill-rule="evenodd" d="M1296,252 C1292,236 1290,214 1286,190 C1282,164 1290,136 1306,121 C1318,110 1336,106 1352,110 C1372,116 1386,134 1392,160 C1398,188 1404,222 1408,252 Z M1305,252 C1306,232 1302,210 1300,188 C1298,164 1306,146 1318,138 C1330,131 1344,132 1354,140 C1366,150 1372,170 1374,196 C1376,220 1378,238 1380,252 Z"/><path d="M1262,266 C1290,251 1316,248 1346,249 C1380,250 1410,255 1446,266 Z"/>`);
  at(1600, `<path d="M0,266 C14,256 28,252 44,252 C60,252 76,256 92,266 Z"/><path d="M36,254 C38,240 38,228 40,222 L50,222 C52,230 52,242 56,254 Z"/><ellipse cx="45" cy="210" rx="25" ry="15"/>`);
  // Joshua Tree.
  at(260, joshuaTrees(C));
  // Saguaro: two saguaro cacti.
  at(300, `<g fill="none" stroke="${C.landmarks}" stroke-linecap="round" stroke-linejoin="round"><path stroke-width="22" d="M1830,264 L1830,128"/><path stroke-width="14" d="M1830,206 L1812,206 Q1805,206 1805,198 L1805,164 M1830,190 L1850,190 Q1857,190 1857,183 L1857,148"/><path stroke-width="14" d="M1886,264 L1886,214"/><path stroke-width="9" d="M1886,240 L1875,240 Q1870,240 1870,234 L1870,222"/></g>`);
  // Bryce Canyon: hoodoos.
  const hoodoos: [number, number, number][] = [[1972, 92, 26], [2002, 124, 30], [2034, 74, 22], [2066, 108, 28], [2098, 62, 20], [2124, 86, 24]];
  at(330, `<path d="M1940,264 L1952,236 L2150,238 L2166,264 Z"/>` + hoodoos.map(([x, h, w]) => hoodoo(x, 240, h, w)).join(""));
  // Death Valley: Mesquite dunes.
  at(2560, `<path d="M0,266 C30,252 60,234 90,227 L97,228 C120,241 150,252 172,257 C192,247 222,237 242,235 L247,236 C266,247 284,257 304,266 Z"/>`);
  // Yellowstone: Old Faithful (cone and steam) and a bison.
  at(660, `<path d="M2218,266 C2256,248 2298,245 2336,247 C2358,250 2370,256 2384,266 Z"/><path fill="${C.accent}" fill-opacity="0.18" filter="url(#steam)" d="M2292,248 C2288,222 2283,200 2290,182 C2276,172 2278,150 2293,141 C2283,125 2291,100 2307,96 C2301,80 2313,60 2331,62 C2347,55 2363,68 2357,84 C2371,92 2369,112 2353,118 C2363,130 2357,152 2339,154 C2343,175 2331,195 2319,200 C2317,220 2313,236 2311,248 Z"/>`);
  at(3080, `<path d="M4,247 C2,241 6,235 12,234 C16,225 24,218 32,219 C42,220 52,225 62,227 C70,228 76,231 78,237 L80,247 L77,241 C76,247 74,251 70,253 L69,265 L64,265 L63,255 L58,255 L57,265 L52,265 L52,254 C44,255 36,255 30,254 L28,265 L23,265 L22,254 L20,265 L15,265 L15,255 C12,257 10,259 8,257 C6,255 4,253 4,247 Z"/><path fill="none" stroke="${C.landmarks}" stroke-width="2" stroke-linecap="round" d="M11,235 Q7,230 10,227"/>`);

  // Yosemite Falls: a granite wall with the upper and lower falls.
  at(0, `<path d="M3260,266 L3268,200 C3272,150 3280,110 3300,92 L3330,86 C3350,84 3362,86 3366,90 L3372,90 C3380,88 3386,94 3392,96 L3440,100 C3470,104 3490,120 3500,150 L3512,220 L3520,266 Z"/><path fill="${C.accent}" fill-opacity="0.7" d="M3365,91 L3372,91 L3373,166 L3379,175 L3377,200 L3375,252 L3368,252 L3367,200 L3363,180 L3365,166 Z"/>`);
  // Zion: The Watchman.
  at(0, `<path d="M3580,266 L3600,240 L3620,236 L3634,210 L3650,206 L3660,170 L3672,166 L3680,130 L3692,126 L3700,96 L3712,92 L3722,118 L3734,122 L3744,150 L3758,154 L3770,190 L3784,196 L3800,240 L3816,266 Z"/>`);
  // The coast: Olympic sea stacks, Arch Rock (Channel Islands) and the Bass
  // Harbor lighthouse (Acadia), all on a strip of sea.
  at(0, `<rect x="3870" y="250" width="600" height="50" fill="${C.water}"/><path fill="none" stroke="${C.accent}" stroke-opacity="0.35" stroke-width="1.5" stroke-linecap="round" d="M3890,262 L3916,262 M3962,270 L4000,270 M4060,259 L4084,259 M4150,266 L4190,266 M4262,272 L4290,272 M4330,262 L4352,262 M4420,268 L4450,268"/>`);
  at(0, `<path d="M3905,254 L3908,200 C3910,186 3918,180 3926,182 L3934,196 L3938,254 Z"/><path d="M3958,254 L3962,222 C3964,214 3972,212 3978,216 L3986,230 L3990,254 Z"/><path d="M4010,254 L4013,196 C4016,186 4026,182 4036,186 L4042,200 L4046,254 Z"/>` + pine(3920, 184, 22, 10) + pine(3928, 186, 16, 8) + pine(4024, 188, 24, 11) + pine(4034, 189, 18, 8));
  at(0, `<path d="M4090,254 C4095,236 4110,222 4130,218 L4200,214 C4220,214 4238,222 4246,236 L4250,254 L4232,254 C4230,242 4224,236 4214,236 C4204,236 4198,242 4196,254 Z"/>`);
  at(0, `<path d="M4290,256 L4296,236 L4320,226 L4360,222 L4400,224 L4430,234 L4446,256 Z"/><path d="M4330,224 L4332,188 L4344,188 L4346,224 Z"/><rect x="4328" y="176" width="20" height="12" rx="1"/><path d="M4325,177 L4338,166 L4351,177 Z"/><path d="M4346,224 L4346,206 L4366,196 L4386,206 L4386,224 Z"/>` + (C.lamp ? `<circle cx="4338" cy="182" r="4" fill="${C.lamp}"/><circle cx="4338" cy="182" r="14" fill="${C.lamp}" fill-opacity="0.18" filter="url(#steam)"/><path fill="${C.lamp}" fill-opacity="0.1" filter="url(#steam)" d="M4338,180 L4176,166 L4176,198 Z M4338,180 L4500,164 L4500,200 Z"/>` : ""));
  // Everglades: two sabal palms and a great blue heron.
  const palm = (x: number, h: number, lean: number) => {
    const tx = x + lean, ty = 262 - h;
    const fronds = [[-34, 6], [-26, -10], [-12, -18], [4, -20], [18, -14], [30, -2], [34, 12], [-30, 16]]
      .map(([dx, dy]) => `M${tx},${ty} Q${tx + dx * 0.5},${ty + dy * 0.5 - 8} ${tx + dx},${ty + dy}`).join(" ");
    return `<path fill="none" stroke="${C.landmarks}" stroke-width="5" stroke-linecap="round" d="M${x},264 Q${x + lean * 0.2},${262 - h * 0.5} ${tx},${ty}"/><path fill="none" stroke="${C.landmarks}" stroke-width="4" stroke-linecap="round" d="${fronds}"/>`;
  };
  at(0, palm(4560, 104, 10) + palm(4618, 80, -8) + `<path d="M4688,264 L4691,238 M4697,264 L4695,238" fill="none" stroke="${C.landmarks}" stroke-width="2" stroke-linecap="round"/><ellipse cx="4697" cy="232" rx="13" ry="7" transform="rotate(-18 4697 232)"/><path fill="none" stroke="${C.landmarks}" stroke-width="3.5" stroke-linecap="round" d="M4688,228 Q4680,214 4688,206 Q4694,200 4690,193"/><ellipse cx="4691" cy="191" rx="4.5" ry="3.2"/><path fill="none" stroke="${C.landmarks}" stroke-width="1.6" stroke-linecap="round" d="M4694,190 L4706,192"/>`);
  // Rocky Mountain: a bull elk.
  at(0, `<path d="M4812,238 C4814,228 4824,224 4842,224 L4880,226 C4890,226 4896,232 4896,240 C4896,246 4892,248 4888,248 L4887,265 L4882,265 L4880,250 L4870,250 L4868,265 L4863,265 L4862,249 L4840,248 L4838,265 L4833,265 L4832,248 L4828,265 L4823,265 L4822,247 C4818,246 4814,242 4812,238 Z"/><path d="M4818,234 L4812,214 C4810,208 4806,205 4800,207 L4793,211 L4795,215 L4806,215 L4814,236 Z"/><path fill="none" stroke="${C.landmarks}" stroke-width="2.2" stroke-linecap="round" d="M4808,207 Q4814,190 4828,178 M4816,194 L4808,184 M4822,186 L4820,174 M4826,181 L4834,174 M4804,207 Q4796,192 4804,178 M4799,195 L4790,190 M4801,186 L4796,176"/>`);
  // Hawaii Volcanoes: a shield volcano with a plume.
  at(0, `<path d="M4980,266 C5040,244 5090,224 5120,214 L5132,214 L5138,218 L5146,218 L5152,213 L5164,214 C5194,224 5242,244 5300,266 Z"/><path fill="${C.accent}" fill-opacity="0.16" filter="url(#steam)" d="M5136,216 C5130,196 5138,178 5150,170 C5146,152 5160,138 5176,140 C5182,124 5202,118 5214,128 C5230,126 5240,140 5234,152 C5246,160 5242,178 5226,180 C5220,194 5200,198 5186,192 C5174,200 5160,204 5152,216 Z"/>`);
  // Mesa Verde: Cliff Palace in an alcove under the mesa rim.
  at(0, `<path fill-rule="evenodd" d="M5340,266 L5352,242 L5360,204 L5366,172 L5374,160 L5552,158 L5560,172 L5568,206 L5578,244 L5590,266 Z M5384,240 C5388,212 5418,194 5466,192 C5514,194 5544,212 5548,240 Z"/><path d="M5392,240 L5392,226 L5410,226 L5410,240 Z M5414,240 L5414,218 L5432,218 L5432,240 Z M5436,240 L5436,206 C5436,199 5452,199 5452,206 L5452,240 Z M5456,240 L5456,222 L5480,222 L5480,240 Z M5484,240 L5484,212 L5498,212 L5498,240 Z M5502,240 L5502,226 L5520,226 L5520,240 Z M5524,240 L5524,230 L5540,230 L5540,240 Z"/>`);

  return svg(
    "landmarks",
    `<defs><filter id="steam" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter></defs><g fill="${C.landmarks}">${g.join("")}</g>${haze(C, "landmarks", 190, 268, 0.42)}`,
  );
}

/** Ground height of the forest hill; periodic over the 2400-unit tile. */
export const treeHillY = (x: number) =>
  116 + 6 * Math.sin((2 * Math.PI * x) / 800) + 4 * Math.sin((2 * Math.PI * x) / 300 + 1);

/** A pine at x on `base`, h tall and w wide (also used by the calculator scene). */
export function pine(x: number, base: number, h: number, w: number): string {
  const p = (dx: number, dy: number) => `${round(x + dx * w)},${round(base - dy * h)}`;
  const pts = [
    p(0, 1), p(0.2, 0.7), p(0.1, 0.7), p(0.34, 0.42), p(0.2, 0.42), p(0.5, 0.12), p(0.06, 0.12), p(0.06, 0),
    p(-0.06, 0), p(-0.06, 0.12), p(-0.5, 0.12), p(-0.2, 0.42), p(-0.34, 0.42), p(-0.1, 0.7), p(-0.2, 0.7),
  ];
  return `<polygon points="${pts.join(" ")}"/>`;
}

/** Pine forest in clusters with clearings, on a rolling hill. */
function treesTile(C: ScenePalette): string {
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
  return svg("trees", `<g fill="${C.trees}">${g.join("")}</g>${haze(C, "trees", 96, 150, 0.3)}`);
}

/** The ridge the hiker walks on: crest near y=16, with tufts, stones and cairns. */
function ridgeTile(C: ScenePalette): string {
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

/** Raw markup of every tile for one palette. */
export const sceneTileMarkup = (palette: ScenePalette): Record<SceneLayer, string> => ({
  clouds: cloudsTile(palette),
  far: farTile(palette),
  landmarks: landmarksTile(palette),
  trees: treesTile(palette),
  ridge: ridgeTile(palette),
});

/** Each layer's tile as a CSS `url(...)` value. */
export function sceneTileUrls(palette: ScenePalette): Record<SceneLayer, string> {
  const markup = sceneTileMarkup(palette);
  return {
    clouds: toCssUrl(markup.clouds),
    far: toCssUrl(markup.far),
    landmarks: toCssUrl(markup.landmarks),
    trees: toCssUrl(markup.trees),
    ridge: toCssUrl(markup.ridge),
  };
}
