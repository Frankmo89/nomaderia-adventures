/**
 * The mountain range the home hero's photo ends in on phones (ADR-048); the
 * night camp reuses `back` and `mid` (ADR-056). Silhouettes 1024 units wide, drawn at 1 unit = 1 CSS px and cut to
 * the screen width from the middle (`xMidYMax slice`), so peaks keep their
 * shape on any phone instead of being squeezed. Each is used as a CSS mask
 * over a flat forest-dark layer; the mask's lower part is solid, so a layer
 * can run down behind the text with no seam.
 */

export interface HeroRidge {
  /** Height in px (= rem × 16): the band the silhouette fills. */
  height: number;
  path: string;
}

export const HERO_RIDGES = {
  /**
   * The hero's far range (ADR-058): Half Dome, Yosemite, as seen from the
   * valley's west end: its sheer face on the left, the top close to it, the
   * dome rounding down to the right. It is the only landmark, right of
   * center and inside the middle 1024 − 2 × 335 units, so a 375 px phone
   * shows it whole; the old granite peaks, lower, around it.
   */
  yosemite: {
    height: 132,
    path: "M0,132 L0,88 L40,79 L84,90 L140,66 L170,74 L214,50 L246,62 L290,54 L330,76 L372,68 L404,85 L450,67 L486,56 L512,62 L530,72 L540,82 L546,78 L545,40 L546,12 C556,7 572,7 586,11 C604,16 624,28 640,42 C650,51 660,58 672,62 L690,64 L700,63 L742,83 L786,60 L818,68 L860,44 L900,62 L944,58 L990,80 L1024,74 L1024,132 Z",
  },
  /** Far range: sharp granite peaks, the highest just right of center. Now only the night camp's. */
  back: { height: 104, path: "M0,104 L0,60 L40,51 L84,62 L140,38 L170,46 L214,22 L246,34 L290,26 L330,48 L372,40 L404,57 L450,39 L486,20 L512,27 L560,4 L600,23 L628,18 L668,42 L700,35 L742,55 L786,32 L818,40 L860,16 L900,34 L944,30 L990,52 L1024,46 L1024,104 Z" },
  /** Middle range: rounder shoulders. */
  mid: { height: 72, path: "M0,72 L0,43 C12,40 48,28 70,28 C92,28 109,41 130,40 C151,39 174,20 196,21 C218,22 240,42 262,44 C284,46 310,35 330,30 C350,25 365,15 380,14 C395,13 405,19 420,24 C435,29 452,44 470,46 C488,48 510,35 530,36 C550,37 570,52 590,50 C610,48 632,32 650,26 C668,20 684,12 700,12 C716,12 727,22 744,28 C761,34 781,47 800,48 C819,49 840,38 860,33 C880,28 900,18 920,18 C940,18 963,33 980,35 C997,37 1017,31 1024,30 L1024,72 Z" },
  /** Front hills with pines; the text stands on these. */
  front: {
    height: 44,
    path: "M0,44 L0,29 C18,28 54,21 90,22 C126,23 144,32 180,32 C216,32 234,22 270,21 C306,20 326,30 360,29 C394,28 408,18 440,18 C472,18 488,27 520,28 C552,29 566,21 600,22 C634,23 654,33 690,32 C726,31 744,20 780,19 C816,18 834,28 870,29 C906,30 929,23 960,22 C991,21 1011,25 1024,26 L1024,44 Z M250,5 L254.2,13.1 L252.3,13.1 L255.7,19.8 L250.9,19.8 L250.9,25 L249.1,25 L249.1,19.8 L244.3,19.8 L247.7,13.1 L245.8,13.1 Z M266,11 L268.8,16.4 L267.5,16.4 L269.8,20.8 L266.6,20.8 L266.6,25 L265.4,25 L265.4,20.8 L262.2,20.8 L264.5,16.4 L263.2,16.4 Z M612,4 L616.4,12.5 L614.4,12.5 L618.0,19.6 L613.0,19.6 L613.0,25 L611.0,25 L611.0,19.6 L606.0,19.6 L609.6,12.5 L607.6,12.5 Z M630,12 L633.0,17.9 L631.6,17.9 L634.1,22.7 L630.7,22.7 L630.7,27 L629.3,27 L629.3,22.7 L625.9,22.7 L628.4,17.9 L627.0,17.9 Z M700,20 L702.5,24.9 L701.4,24.9 L703.5,29.0 L700.6,29.0 L700.6,33 L699.4,33 L699.4,29.0 L696.5,29.0 L698.6,24.9 L697.5,24.9 Z M452,6 L455.2,12.3 L453.8,12.3 L456.4,17.5 L452.7,17.5 L452.7,22 L451.3,22 L451.3,17.5 L447.6,17.5 L450.2,12.3 L448.8,12.3 Z M150,16 L153.0,21.9 L151.6,21.9 L154.1,26.7 L150.7,26.7 L150.7,31 L149.3,31 L149.3,26.7 L145.9,26.7 L148.4,21.9 L147.0,21.9 Z M830,9 L833.7,16.2 L832.0,16.2 L835.0,22.1 L830.8,22.1 L830.8,27 L829.2,27 L829.2,22.1 L825.0,22.1 L828.0,16.2 L826.3,16.2 Z M846,16 L848.3,20.5 L847.3,20.5 L849.1,24.2 L846.5,24.2 L846.5,28 L845.5,28 L845.5,24.2 L842.9,24.2 L844.7,20.5 L843.7,20.5 Z",
  },
} as const satisfies Record<string, HeroRidge>;

/** `url("data:image/svg+xml,…")` of one silhouette, for `mask-image`. */
export function ridgeMaskUrl(ridge: HeroRidge): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 ${ridge.height}" preserveAspectRatio="xMidYMax slice">` +
    `<path d="${ridge.path}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
