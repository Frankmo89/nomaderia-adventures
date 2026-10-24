/**
 * Silhouettes for the canyon passage between the travel insurance block and
 * the FAQ (ADR-052): a Grand Canyon seen from inside, in the same flat poster
 * style as the hero's range (ADR-048) and the promise forest (ADR-050).
 * Coordinates: y 0 (top) → 400 (bottom) of the band; x 0 → 400 across the
 * whole band for the far layers, 0 (screen edge) → 200 (centre) for the side
 * walls, mirrored for the right side. Drawn with straight segments only, so
 * mirroring is a plain x → 200 − x. Each shape is a CSS mask stretched to its
 * box (`preserveAspectRatio="none"`): terraces just get longer on wide screens.
 */

export interface CanyonShape {
  width: number;
  height: number;
  path: string;
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
  /** The river, winding from the foreground to the buttes. */
  river: {
    width: 400,
    height: 400,
    path: "M164,400 L182,384 L200,368 L212,352 L206,336 L194,320 L190,304 L196,288 L201,274 L200,264 L204,264 L207,274 L204,288 L202,304 L208,320 L222,336 L230,352 L220,368 L206,384 L236,400 Z",
  },
  /** Middle wall (left side; mirrored for the right). */
  midWall: {
    width: 200,
    height: 400,
    path: "M0,400 L0,186 L48,184 L54,214 L86,218 L92,252 L118,256 L126,292 L150,300 L160,340 L180,352 L186,400 Z",
  },
  /** Near wall (left side; mirrored for the right): tall stepped cliffs. */
  nearWall: {
    width: 200,
    height: 400,
    path: "M0,400 L0,40 L30,42 L36,96 L52,100 L58,170 L74,176 L82,250 L98,258 L106,330 L122,342 L128,400 Z",
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
