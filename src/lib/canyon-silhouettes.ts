/**
 * Silhouettes for the canyon passage between the travel insurance block and
 * the FAQ (ADR-052): a canyon seen from inside, drawn as flat silhouettes in
 * the brand greens, like the hero's range (ADR-048) and the promise forest
 * (ADR-050).
 * Coordinates: y 0 (top) → 400 (bottom) of the band; x 0 → 400 across the
 * whole band for the far layers, 0 (screen edge) → 200 (centre) for the side
 * walls, mirrored for the right side. Drawn with straight segments only, so
 * mirroring is a plain x → 200 − x. The lookout ledge has its own 400 × 100
 * box. Each shape is a CSS mask stretched to its
 * box (`preserveAspectRatio="none"`): terraces just get longer on wide screens.
 */

export interface CanyonShape {
  width: number;
  height: number;
  path: string;
}

const RIVER_TOP = 262;
const RIVER_STEPS = 34;
const round = (v: number) => Math.round(v * 10) / 10;

/**
 * Where the river runs, s = 0 at the buttes → 1 at the bottom edge: its
 * centre (x), height (y) and half width, in the 400 × 400 box. It swings
 * wider and grows wider as it comes closer, like a path seen from above.
 */
export function riverAt(s: number): { x: number; y: number; half: number } {
  const swing = 3 + 44 * s ** 1.7;
  return {
    x: 203 - 10 * s + swing * Math.sin(2.35 * Math.PI * s + 0.25),
    y: RIVER_TOP + (400 - RIVER_TOP) * s,
    // Tapers to a point at its source, far away between the buttes.
    half: 1.4 * Math.min(1, s * 6) + 62 * s ** 2.3,
  };
}

/** The river's outline; `glow` 1 widens it into the band around it. */
function riverShape(glow: 0 | 1): CanyonShape {
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= RIVER_STEPS; i++) {
    const s = i / RIVER_STEPS;
    const { x, y, half } = riverAt(s);
    const w = half * (1 + 0.35 * glow) + glow * 5 * (0.3 + s);
    const fit = (v: number) => round(Math.min(Math.max(v, 0), 400));
    left.push(`${fit(x - w)},${round(y)}`);
    right.unshift(`${fit(x + w)},${round(y)}`);
  }
  return { width: 400, height: 400, path: `M${[...left, ...right].join(" L")} Z` };
}

export const CANYON = {
  /** The far rim: an almost flat line of mesas across the whole band. */
  farRim: {
    width: 400,
    height: 400,
    path: "M0,400 L0,170 L40,168 L46,160 L90,158 L96,166 L150,164 L156,156 L210,154 L216,162 L270,162 L276,152 L330,150 L336,160 L400,162 L400,400 Z",
  },
  /** Two buttes in the middle distance, on the canyon floor. */
  buttes: {
    width: 400,
    height: 400,
    path: "M0,400 L0,262 L110,258 L118,236 L128,232 L134,206 L170,204 L176,230 L186,234 L192,256 L222,256 L228,240 L238,236 L244,214 L284,212 L290,238 L300,242 L306,258 L400,262 L400,400 Z",
  },
  /** The river: an S from the buttes (thin, far) to the bottom edge (wide, near). */
  river: riverShape(0),
  /** A wider, paler band around the river: its glow, drawn flat. */
  riverGlow: riverShape(1),
  /** Middle wall (left side; mirrored for the right). */
  midWall: {
    width: 200,
    height: 400,
    path: "M0,400 L0,186 L48,184 L54,214 L86,218 L92,252 L118,256 L126,292 L150,300 L160,340 L170,352 L172,400 Z",
  },
  /** Near wall (left side; mirrored for the right): tall stepped cliffs. */
  nearWall: {
    width: 200,
    height: 400,
    path: "M0,400 L0,40 L30,42 L36,96 L52,100 L58,170 L74,176 L82,250 L98,258 L106,330 L122,342 L128,400 Z",
  },
  /** A river bank you land by at the end (left; mirrored), in its own 200 × 100 box. */
  bank: {
    width: 200,
    height: 100,
    path: "M0,100 L0,26 L70,22 L122,30 L176,46 L196,58 L150,62 L172,78 L200,100 Z",
  },
  /** The lookout you start on: a rock at the bottom of the screen, in its own 400 × 100 box. */
  ledge: {
    width: 400,
    height: 100,
    path: "M0,100 L0,36 L48,32 L120,27 L196,24 L246,28 L270,36 L262,46 L276,58 L270,72 L282,100 Z",
  },
} as const satisfies Record<string, CanyonShape>;

/** The same shape seen from the other side (x → width − x). Straight segments only. */
export function mirrorShape(s: CanyonShape): CanyonShape {
  const path = s.path.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x: string, y: string) => `${s.width - Number(x)},${y}`);
  return { ...s, path };
}

/** `url("data:image/svg+xml,…")` stretched to its box, for `mask-image`. */
export function canyonMaskUrl(s: CanyonShape): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s.width} ${s.height}" preserveAspectRatio="none">` +
    `<path d="${s.path}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
