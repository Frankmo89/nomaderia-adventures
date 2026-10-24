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

/** One lobe of foliage: a 12-sided ellipse with a flatter underside, points clockwise. */
function lobe(cx: number, cy: number, rx: number, ry: number): string {
  const pts: string[] = [];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const under = Math.sin(a) > 0 ? 0.75 : 1;
    const x = Math.min(Math.max(cx + Math.cos(a) * rx, 0), 200);
    const y = Math.min(Math.max(cy + Math.sin(a) * ry * under, 0), 160);
    pts.push(`${round(x)},${round(y)}`);
  }
  return `M${pts.join(" L")} Z`;
}

/** A clump of foliage: a few overlapping lobes of different sizes, so its outline is bumpy like a cloud. */
function clump(cx: number, cy: number, rx: number, ry: number, seed: number): string {
  const parts = [lobe(cx, cy + ry * 0.15, rx * 0.8, ry * 0.6)];
  const n = rx > 20 ? 5 : 4;
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1) - 0.5;
    const h = hash(seed * 17 + k);
    const lx = cx + t * rx * 1.5;
    const ly = cy - (0.5 - Math.abs(t)) * ry * 0.7 + (h - 0.5) * ry * 0.4;
    parts.push(lobe(lx, ly, rx * (0.32 + 0.14 * h), ry * (0.62 + 0.25 * hash(seed * 7 + k))));
  }
  return parts.join(" ");
}

/** A thick limb from the trunk side (x 0) reaching to `length`, rising a little and thinning. */
function limb(y0: number, length: number, thick: number): string {
  const tip = y0 - 6;
  return `M0,${y0 - thick} L${length},${tip - 1.5} L${length},${tip + 1.5} L0,${y0 + thick} Z`;
}

/**
 * A corner of the canopy (left; mirrored for the right), in a 200 × 160 box:
 * a dark mass at the top corner and three thick limbs carrying rounded
 * clumps of foliage, longest at the top, so the two corners frame an arch
 * of sky (sequoia foliage grows in clumps along nearly level limbs).
 */
function canopyShape(): GroveShape {
  const mass = "M0,0 L200,0 L200,4 L150,8 L100,12 L50,18 L0,24 Z";
  const limbs = [limb(34, 176, 4), limb(78, 136, 3.5), limb(118, 92, 3)];
  // [cx, cy, rx, ry] along each limb, sitting on and hanging below it.
  const clumps: [number, number, number, number][] = [
    [26, 30, 30, 17], [70, 28, 28, 15], [114, 24, 26, 14], [154, 22, 24, 12], [186, 20, 16, 9],
    [20, 74, 26, 16], [60, 72, 25, 14], [98, 68, 22, 13], [132, 64, 16, 9],
    [16, 114, 22, 14], [52, 112, 20, 12], [86, 108, 14, 8],
    [10, 146, 14, 11],
  ];
  return {
    width: 200,
    height: 160,
    path: [mass, ...limbs, ...clumps.map(([cx, cy, rx, ry], i) => clump(cx, cy, rx, ry, i + 1))].join(" "),
  };
}

export const GROVE = {
  /** A sequoia trunk: a column, a little narrower at the top, with wide buttress roots, in a 100 × 400 box. */
  trunk: {
    width: 100,
    height: 400,
    path: "M27,0 L73,0 L80,288 L86,328 L95,360 L100,378 L100,400 L0,400 L0,378 L5,360 L14,328 L20,288 Z",
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
