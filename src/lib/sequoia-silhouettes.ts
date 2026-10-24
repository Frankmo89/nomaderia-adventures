/**
 * Shapes for the giant sequoia grove of the promise section (ADR-055): flat
 * silhouettes in the brand greens, like the forest treelines (ADR-050) and
 * the canyon (ADR-052, ADR-054). Straight segments only, so a shape seen
 * from the other side is a plain x → width − x (`mirror`). Each is a CSS mask
 * stretched to its box (`preserveAspectRatio="none"`).
 */

export interface GroveShape {
  width: number;
  height: number;
  path: string;
}

const round = (v: number) => Math.round(v * 10) / 10;
/** Fixed pseudo-random 0–1 for index `i` (no randomness at render). */
const hash = (i: number) => {
  const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * One bough reaching out from the trunk side (x 0) toward the middle
 * (x 0 + length), drooping a little and thinning toward its tip: a smooth
 * upper edge and a lower edge of needle tufts that hang down, deeper near
 * the trunk. Clockwise, so boughs drawn in one path add up.
 */
function branch(y0: number, length: number, thick: number, seed: number): string {
  const n = Math.max(3, Math.round(length / 7));
  const centre = (t: number) => y0 + 18 * t ** 1.5;
  const half = (t: number) => thick * (1 - t) ** 0.6 + 1.5;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    top.push(`${round(length * t)},${round(centre(t) - half(t) * 0.7)}`);
  }
  for (let i = n; i >= 1; i--) {
    const t = i / n;
    const x = length * t;
    const seg = length / n;
    const j = 0.5 + 1.1 * hash(seed + i);
    // A tuft: hangs from just before x, its tip a little back toward the trunk.
    bottom.push(`${round(x - seg * 0.1)},${round(centre(t) + half(t) * 0.55)}`);
    bottom.push(`${round(x - seg * 0.5)},${round(centre(t) + half(t) * (0.8 + 0.6 * j))}`);
    bottom.push(`${round(x - seg * 0.85)},${round(centre(t) + half(t) * 0.7)}`);
  }
  return `M0,${round(y0 - thick * 0.7)} L${top.join(" L")} L${bottom.join(" L")} L0,${round(y0 + thick)} Z`;
}

/**
 * A corner of the canopy (left; mirrored for the right), in a 200 × 160 box:
 * a dark mass at the top corner with tiers of drooping branches below it,
 * longest at the top, so the two corners frame an arch of sky.
 */
function canopyShape(): GroveShape {
  const mass = "M0,0 L200,0 L200,6 L150,12 L110,20 L70,28 L30,38 L0,44 Z";
  const tiers = [
    branch(16, 198, 16, 1),
    branch(44, 172, 16, 20),
    branch(72, 142, 15, 40),
    branch(98, 108, 14, 60),
    branch(122, 74, 13, 80),
  ];
  return { width: 200, height: 160, path: [mass, ...tiers].join(" ") };
}

export const GROVE = {
  /** A sequoia trunk: a tall column with a flared, fluted base, in a 100 × 400 box. */
  trunk: {
    width: 100,
    height: 400,
    path: "M22,0 L78,0 L80,300 L84,338 L92,366 L100,388 L100,400 L0,400 L0,388 L8,366 L16,338 L20,300 Z",
  },
  /** Bark grooves running down a trunk (same box as `trunk`). */
  grooves: {
    width: 100,
    height: 400,
    path: "M38,0 L42,0 L43,322 L39,322 Z M58,24 L61,24 L62,332 L59,332 Z M29,60 L31,60 L31,300 L29,300 Z",
  },
  /** A canopy corner (left; mirrored for the right). */
  canopy: canopyShape(),
} as const satisfies Record<string, GroveShape>;

/** The same shape seen from the other side (x → width − x). Straight segments only. */
export function mirror(s: GroveShape): GroveShape {
  const path = s.path.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x: string, y: string) => `${round(s.width - Number(x))},${y}`);
  return { ...s, path };
}

/** `url("data:image/svg+xml,…")` stretched to its box, for `mask-image`. */
export function groveMaskUrl(s: GroveShape): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s.width} ${s.height}" preserveAspectRatio="none">` +
    `<path d="${s.path}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
