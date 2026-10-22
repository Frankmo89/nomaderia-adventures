/**
 * Frank's own photos in public/hero/vN/, shared by the Hero slideshow and
 * the quiz backdrop (ADR-042).
 *
 * /hero/* is cached immutable for a year (public/_headers). A new photo set
 * goes in a new folder: HERO_BASE here, HERO_VERSION in
 * scripts/generate-hero-images.mjs and the index.html preload move together
 * (ADR-038).
 */
export const HERO_BASE = "/hero/v2";
export const HERO_WIDTHS = [640, 1080, 1600] as const;

/** "640w, 1080w, 1600w" srcset for one photo id ("01" … "06"). */
export function heroSrcSet(id: string, ext: "avif" | "webp"): string {
  return HERO_WIDTHS.map((w) => `${HERO_BASE}/${id}-${w}.${ext} ${w}w`).join(", ");
}

/** Fallback <img> src: the 1080 WebP. */
export function heroFallbackSrc(id: string): string {
  return `${HERO_BASE}/${id}-1080.webp`;
}
