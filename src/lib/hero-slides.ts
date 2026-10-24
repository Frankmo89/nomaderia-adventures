import { resizedImageUrl } from "@/lib/resized-image";

/**
 * Slides for the home hero (ADR-046). The first slide is always the local,
 * preloaded cover, so the page paints fast; after it come the photos Frank
 * keeps active in /admin/galeria, in his order. With no gallery photos (still
 * loading, none active, or the query failed) the local set plays instead.
 */

export interface HeroSlide {
  key: string;
  /** Fallback `src`. */
  src: string;
  /** `srcSet` for the <img> (WebP/AVIF sources are added for local photos). */
  srcSet: string;
  /** Local photos also have AVIF/WebP sets for <picture>. */
  local?: { avif: string; webp: string };
  /** Park shown, for the chip; null hides the chip. */
  place: string | null;
  alt: string;
}

export interface LocalHeroPhoto {
  id: string;
  place: string;
  alt: string;
}

export interface GalleryHeroPhoto {
  id: string;
  public_url: string;
  caption: string | null;
}

export const HERO_LOCAL_BASE = "/hero/v2";
const LOCAL_WIDTHS = [640, 1080, 1600] as const;
const GALLERY_WIDTHS = [640, 1080, 1440] as const;

const localSet = (id: string, ext: "avif" | "webp") =>
  LOCAL_WIDTHS.map((w) => `${HERO_LOCAL_BASE}/${id}-${w}.${ext} ${w}w`).join(", ");

export function localSlide(photo: LocalHeroPhoto): HeroSlide {
  return {
    key: `local-${photo.id}`,
    src: `${HERO_LOCAL_BASE}/${photo.id}-1080.webp`,
    srcSet: localSet(photo.id, "webp"),
    local: { avif: localSet(photo.id, "avif"), webp: localSet(photo.id, "webp") },
    place: photo.place,
    alt: photo.alt,
  };
}

/** A gallery photo, resized by Supabase (same render endpoint as the newsletter). */
export function gallerySlide(photo: GalleryHeroPhoto): HeroSlide {
  const place = photo.caption?.replace(/\s+/g, " ").trim() || null;
  return {
    key: `gallery-${photo.id}`,
    src: resizedImageUrl(photo.public_url, 1080),
    srcSet: GALLERY_WIDTHS.map((w) => `${resizedImageUrl(photo.public_url, w)} ${w}w`).join(", "),
    place,
    alt: place ? `Foto de ${place}` : "Foto de un parque nacional",
  };
}

/** Cover first, then the gallery; or the whole local set when there is none. */
export function heroSlides(local: readonly LocalHeroPhoto[], gallery: readonly GalleryHeroPhoto[] | undefined): HeroSlide[] {
  const usable = (gallery ?? []).filter((p) => p.public_url);
  if (usable.length === 0) return local.map(localSlide);
  return [localSlide(local[0]), ...usable.map(gallerySlide)];
}

/**
 * Next slide index. With gallery photos the cover shows once (slide 0) and
 * the loop then runs over slides 1..n; with only local photos it loops all.
 */
export function nextHeroSlide(index: number, count: number, coverOnce: boolean): number {
  if (count <= 1) return 0;
  const next = index + 1;
  if (next < count) return next;
  return coverOnce ? 1 : 0;
}
