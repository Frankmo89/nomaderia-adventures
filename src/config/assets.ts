/**
 * Centralised brand assets.
 * Change the values here and every runtime TS/React page or component will pick them up automatically.
 * NOTE: index.html meta tags must be updated manually — see the sync comments there.
 */
export const BRAND_ASSETS = {
  /** Horizontal logo for light grounds (cloud, white). */
  logo: "/brand/nomaderia-horizontal.svg",

  /** Horizontal logo for dark grounds and photos. */
  logoOnDark: "/brand/nomaderia-horizontal-oscuro.svg",

  /** Pin symbol for light grounds. */
  symbol: "/brand/nomaderia-simbolo.svg",

  /** Pin symbol for dark grounds. */
  symbolOnDark: "/brand/nomaderia-simbolo-oscuro.svg",

  /** Default Open-Graph / Twitter Card image when a page-specific image is not provided. */
  defaultOgImage: "https://nomaderia.com/og-image.png",
} as const;
