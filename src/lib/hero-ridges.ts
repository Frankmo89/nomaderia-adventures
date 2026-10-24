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
  back: { height: 160, path: "M0,160 L0,92 L40,78 L84,96 L140,58 L170,70 L214,34 L246,52 L290,40 L330,74 L372,62 L404,88 L450,60 L486,30 L512,42 L560,6 L600,36 L628,28 L668,64 L700,54 L742,84 L786,50 L818,62 L860,24 L900,52 L944,46 L990,80 L1024,70 L1024,160 Z" },
  /** Middle range: rounder shoulders. */
  mid: { height: 104, path: "M0,104 L0,62 C12,58 48,41 70,40 C92,39 109,60 130,58 C151,56 174,29 196,30 C218,31 240,62 262,64 C284,66 310,51 330,44 C350,37 365,22 380,20 C395,18 405,26 420,34 C435,42 452,63 470,66 C488,69 510,51 530,52 C550,53 570,74 590,72 C610,70 632,47 650,38 C668,29 684,18 700,18 C716,18 727,31 744,40 C761,49 781,69 800,70 C819,71 840,55 860,48 C880,41 900,26 920,26 C940,26 963,47 980,50 C997,53 1017,45 1024,44 L1024,104 Z" },
  /** Front hills with pines; the text stands on these. */
  front: {
    height: 60,
    path: "M0,60 L0,40 C18,38 54,29 90,30 C126,31 144,44 180,44 C216,44 234,29 270,28 C306,27 326,41 360,40 C394,39 408,24 440,24 C472,24 488,37 520,38 C552,39 566,29 600,30 C634,31 654,45 690,44 C726,43 744,27 780,26 C816,25 834,39 870,40 C906,41 929,31 960,30 C991,29 1011,35 1024,36 L1024,60 Z M250,10 L255.1,19.9 L252.8,19.9 L256.9,28.0 L251.1,28.0 L251.1,34 L248.9,34 L248.9,28.0 L243.1,28.0 L247.2,19.9 L244.9,19.9 Z M266,16 L269.5,22.8 L267.9,22.8 L270.7,28.3 L266.8,28.3 L266.8,33 L265.2,33 L265.2,28.3 L261.3,28.3 L264.1,22.8 L262.5,22.8 Z M612,8 L617.5,18.8 L615.0,18.8 L619.6,27.7 L613.2,27.7 L613.2,34 L610.8,34 L610.8,27.7 L604.4,27.7 L609.0,18.8 L606.5,18.8 Z M630,18 L633.7,25.2 L632.0,25.2 L635.0,31.1 L630.8,31.1 L630.8,36 L629.2,36 L629.2,31.1 L625.0,31.1 L628.0,25.2 L626.3,25.2 Z M700,28 L703.2,34.3 L701.8,34.3 L704.4,39.5 L700.7,39.5 L700.7,44 L699.3,44 L699.3,39.5 L695.6,39.5 L698.2,34.3 L696.8,34.3 Z M452,9 L456.2,17.1 L454.3,17.1 L457.7,23.8 L452.9,23.8 L452.9,29 L451.1,29 L451.1,23.8 L446.3,23.8 L449.7,17.1 L447.8,17.1 Z M150,24 L153.7,31.2 L152.0,31.2 L155.0,37.1 L150.8,37.1 L150.8,42 L149.2,42 L149.2,37.1 L145.0,37.1 L148.0,31.2 L146.3,31.2 Z M830,14 L834.6,23.0 L832.5,23.0 L836.3,30.4 L831.0,30.4 L831.0,36 L829.0,36 L829.0,30.4 L823.7,30.4 L827.5,23.0 L825.4,23.0 Z M846,23 L849.0,28.9 L847.6,28.9 L850.1,33.7 L846.7,33.7 L846.7,38 L845.3,38 L845.3,33.7 L841.9,33.7 L844.4,28.9 L843.0,28.9 Z",
  },
} as const satisfies Record<string, HeroRidge>;

/** `url("data:image/svg+xml,…")` of one silhouette, for `mask-image`. */
export function ridgeMaskUrl(ridge: HeroRidge): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 ${ridge.height}" preserveAspectRatio="xMidYMax slice">` +
    `<path d="${ridge.path}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
