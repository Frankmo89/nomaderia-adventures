import { resizedImageUrl } from "@/lib/resized-image";

/**
 * Slides for the home hero (ADR-046, ADR-058). The first slide is always the
 * local, preloaded cover, so the page paints fast; after it come photos Frank
 * keeps active in /admin/galeria, a few drawn at random per visit. With no
 * gallery photos (still loading, none active, or the query failed) the local
 * set plays instead. The hero plays them as stories: bars, tap and swipe.
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

/**
 * How many gallery photos one visit shows (ADR-058). `random` returns [0, 1);
 * the hero passes a seeded one, so a visit keeps its pick when the list
 * refetches.
 */
export interface HeroPick {
  max: number;
  random: () => number;
}

/** A small seeded random generator (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `count` items in random order (Fisher–Yates on a copy). */
function pickRandom<T>(items: readonly T[], count: number, random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.max(0, count));
}

/**
 * Cover first, then the gallery; or the whole local set when there is none.
 * With `pick`, the gallery part is `pick.max − 1` photos drawn at random, so
 * the story bars stay few and a visit downloads only what it shows.
 */
export function heroSlides(
  local: readonly LocalHeroPhoto[],
  gallery: readonly GalleryHeroPhoto[] | undefined,
  pick?: HeroPick,
): HeroSlide[] {
  const usable = (gallery ?? []).filter((p) => p.public_url);
  if (usable.length === 0) return local.map(localSlide);
  const chosen = pick ? pickRandom(usable, pick.max - 1, pick.random) : usable;
  return [localSlide(local[0]), ...chosen.map(gallerySlide)];
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

/** Previous slide index; on the first one it stays (the story starts over). */
export function prevHeroSlide(index: number): number {
  return index > 0 ? index - 1 : 0;
}

export type StoryDirection = "next" | "prev";
export interface StoryStep {
  direction: StoryDirection;
  kind: "tap" | "swipe";
}

/** Pixels a finger may drift and still count as a tap. */
export const STORY_TAP_SLOP = 12;
const SWIPE_MIN = 40;
/** Left part of the photo that steps back, as on Instagram. */
const BACK_ZONE = 0.3;

/**
 * What a press on the photo does when it ends: a sideways swipe or a tap on
 * either side steps; anything else (a scroll, a diagonal drag) does nothing.
 * `dx`/`dy`: how far the pointer moved; `x`: where it ended inside the photo.
 */
export function storyStep({ dx, dy, x, width }: { dx: number; dy: number; x: number; width: number }): StoryStep | null {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax >= SWIPE_MIN && ax > ay * 1.5) return { direction: dx < 0 ? "next" : "prev", kind: "swipe" };
  if (ax < STORY_TAP_SLOP && ay < STORY_TAP_SLOP) {
    return { direction: x < width * BACK_ZONE ? "prev" : "next", kind: "tap" };
  }
  return null;
}
