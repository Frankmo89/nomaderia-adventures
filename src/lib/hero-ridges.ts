/**
 * The mountain range the home hero's photo ends in on phones (ADR-048).
 * Three silhouettes, 1024 units wide, drawn at 1 unit = 1 CSS px and cut to
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
  /** Far range: sharp granite peaks, the highest just right of center. */
  back: { height: 136, path: "M0,136 L0,78 L40,66 L84,82 L140,49 L170,60 L214,29 L246,44 L290,34 L330,63 L372,53 L404,75 L450,51 L486,26 L512,36 L560,5 L600,31 L628,24 L668,54 L700,46 L742,71 L786,42 L818,53 L860,20 L900,44 L944,39 L990,68 L1024,60 L1024,136 Z" },
  /** Middle range: rounder shoulders. */
  mid: { height: 92, path: "M0,92 L0,55 C12,52 48,36 70,35 C92,34 109,52 130,51 C151,50 174,26 196,27 C218,28 240,55 262,57 C284,59 310,46 330,39 C350,32 365,20 380,18 C395,16 405,23 420,30 C435,37 452,55 470,58 C488,61 510,45 530,46 C550,47 570,66 590,64 C610,62 632,42 650,34 C668,26 684,16 700,16 C716,16 727,27 744,35 C761,43 781,61 800,62 C819,63 840,48 860,42 C880,36 900,23 920,23 C940,23 963,41 980,44 C997,47 1017,40 1024,39 L1024,92 Z" },
  /** Front hills with pines; the text stands on these. */
  front: {
    height: 52,
    path: "M0,52 L0,35 C18,33 54,25 90,26 C126,27 144,38 180,38 C216,38 234,25 270,24 C306,23 326,36 360,35 C394,34 408,21 440,21 C472,21 488,32 520,33 C552,34 566,25 600,26 C634,27 654,39 690,38 C726,37 744,24 780,23 C816,22 834,34 870,35 C906,36 929,27 960,26 C991,25 1011,30 1024,31 L1024,52 Z M250,8 L254.6,17.0 L252.5,17.0 L256.3,24.4 L251.0,24.4 L251.0,30 L249.0,30 L249.0,24.4 L243.7,24.4 L247.5,17.0 L245.4,17.0 Z M266,13 L269.2,19.3 L267.8,19.3 L270.4,24.5 L266.7,24.5 L266.7,29 L265.3,29 L265.3,24.5 L261.6,24.5 L264.2,19.3 L262.8,19.3 Z M612,6 L617.1,15.9 L614.8,15.9 L618.9,24.0 L613.1,24.0 L613.1,30 L610.9,30 L610.9,24.0 L605.1,24.0 L609.2,15.9 L606.9,15.9 Z M630,15 L633.2,21.3 L631.8,21.3 L634.4,26.5 L630.7,26.5 L630.7,31 L629.3,31 L629.3,26.5 L625.6,26.5 L628.2,21.3 L626.8,21.3 Z M700,23 L703.0,28.9 L701.6,28.9 L704.1,33.7 L700.7,33.7 L700.7,38 L699.3,38 L699.3,33.7 L695.9,33.7 L698.4,28.9 L697.0,28.9 Z M452,7 L455.7,14.2 L454.0,14.2 L457.0,20.1 L452.8,20.1 L452.8,25 L451.2,25 L451.2,20.1 L447.0,20.1 L450.0,14.2 L448.3,14.2 Z M150,21 L153.2,27.3 L151.8,27.3 L154.4,32.5 L150.7,32.5 L150.7,37 L149.3,37 L149.3,32.5 L145.6,32.5 L148.2,27.3 L146.8,27.3 Z M830,11 L834.2,19.1 L832.3,19.1 L835.7,25.8 L830.9,25.8 L830.9,31 L829.1,31 L829.1,25.8 L824.3,25.8 L827.7,19.1 L825.8,19.1 Z M846,19 L848.8,24.4 L847.5,24.4 L849.8,28.8 L846.6,28.8 L846.6,33 L845.4,33 L845.4,28.8 L842.2,28.8 L844.5,24.4 L843.2,24.4 Z",
  },
} as const satisfies Record<string, HeroRidge>;

/** `url("data:image/svg+xml,…")` of one silhouette, for `mask-image`. */
export function ridgeMaskUrl(ridge: HeroRidge): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 ${ridge.height}" preserveAspectRatio="xMidYMax slice">` +
    `<path d="${ridge.path}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
