// supabase/functions/_shared/mirror-park-images.ts
// Pure helpers for mirror-park-images (ADR-057). Shared by Deno edge + Vitest (@shared).

/** Minimum download size — tiny files are usually broken/placeholder. */
export const MIN_IMAGE_BYTES = 20 * 1024;

/** Cap per park (edge time limit + gallery size). */
export const MAX_PARK_IMAGES = 6;

/** Storage bucket that holds mirrored NPS destination photos. */
export const DESTINATIONS_BUCKET = "destinations";

/** Public object path prefix inside the destinations bucket for mirrored NPS photos. */
export const NPS_MIRROR_PREFIX = "nps";

export type ImageSkipReason =
  | "download_failed"
  | "not_image"
  | "too_small"
  | "copyrighted";

export interface NpsImageMeta {
  url: string;
  credit?: string | null;
  altText?: string | null;
  title?: string | null;
  caption?: string | null;
}

/**
 * True when `url` is a public or signed Storage object on this project's Supabase host,
 * regardless of bucket (`destinations`, `destinations_media`, etc.).
 * Shape: `{SUPABASE_URL}/storage/v1/object/public/<bucket>/...`
 * Also accepts `/storage/v1/object/sign/<bucket>/...`.
 */
export function isOurStorageUrl(
  url: string | null | undefined,
  supabaseUrl: string,
): boolean {
  if (!url || !supabaseUrl) return false;
  try {
    const u = new URL(url);
    const base = new URL(supabaseUrl);
    if (u.host !== base.host) return false;
    const path = u.pathname;
    return (
      path.includes("/storage/v1/object/public/") ||
      path.includes("/storage/v1/object/sign/")
    );
  } catch {
    return false;
  }
}

/** @deprecated Prefer isOurStorageUrl — kept as alias for older call sites. */
export const isOurDestinationsStorageUrl = isOurStorageUrl;

/** True when the URL is hosted on nps.gov (structured_data or otherwise). */
export function isNpsGovUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "nps.gov" || host.endsWith(".nps.gov");
  } catch {
    return false;
  }
}

/** Credit looks like it retains copyright (not safe to rehost as public domain). */
export function creditLooksCopyrighted(credit: string | null | undefined): boolean {
  if (!credit) return false;
  if (credit.includes("©")) return true;
  return credit.toLowerCase().includes("copyright");
}

/**
 * Decide whether a downloaded candidate should be skipped.
 * Pass `downloadOk: false` when fetch failed (network / non-2xx).
 */
export function evaluateDownloadedImage(opts: {
  downloadOk: boolean;
  contentType: string | null | undefined;
  byteLength: number;
  credit?: string | null;
}): ImageSkipReason | null {
  if (creditLooksCopyrighted(opts.credit)) return "copyrighted";
  if (!opts.downloadOk) return "download_failed";
  const ct = (opts.contentType ?? "").toLowerCase().split(";")[0].trim();
  if (!ct.startsWith("image/")) return "not_image";
  if (opts.byteLength < MIN_IMAGE_BYTES) return "too_small";
  return null;
}

/** Build the Storage object path for a mirrored NPS photo. */
export function mirrorObjectPath(slug: string, index: number): string {
  return `${NPS_MIRROR_PREFIX}/${slug}/${index}.jpg`;
}

/** Public URL for an object in the destinations bucket. */
export function destinationsPublicUrl(supabaseUrl: string, objectPath: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${DESTINATIONS_BUCKET}/${objectPath}`;
}

export type HeroMirrorStatus = "replaced" | "kept" | "missing";

export interface MirrorPlan {
  heroStatus: HeroMirrorStatus;
  /**
   * Candidate indices (into the good-candidates array) to upload.
   * Empty when noop / leave-alone / no candidates needed.
   */
  uploadCandidateIndexes: number[];
  /** Existing Storage hero to keep (when heroStatus is "kept"). */
  keepHeroUrl: string | null;
  /**
   * Current gallery URLs in order. Used with `galleryReplaceNpsOnly` to rebuild
   * the gallery by swapping only nps.gov slots.
   */
  currentGalleryUrls: string[];
  /** Existing gallery URLs that already point at our Storage (preserved, in order). */
  keepGalleryUrls: string[];
  /** Number of nps.gov gallery slots that need a replacement upload. */
  npsGallerySlots: number;
  /**
   * When true: hero is ours and gallery has nps.gov entries — replace only those
   * slots; do not append leftover uploads; never put hero into gallery.
   */
  galleryReplaceNpsOnly: boolean;
  /** Leave the destinations row untouched (noop or no working photo). */
  leaveRowAlone: boolean;
  /**
   * Fully done: hero ours + no nps.gov in gallery. Caller must skip download,
   * upload, and DB write.
   */
  noop: boolean;
  needsManualPhoto: boolean;
}

/**
 * Plan what to write given current DB URLs and how many good NPS candidates we have.
 * Never replaces a URL that already points at our Storage (any bucket).
 * Idempotent: a second plan on an already-mirrored row is a noop.
 */
export function planMirrorWrite(opts: {
  currentHero: string | null | undefined;
  currentGallery: string[] | null | undefined;
  goodCandidateCount: number;
  supabaseUrl: string;
}): MirrorPlan {
  const heroOurs = isOurStorageUrl(opts.currentHero, opts.supabaseUrl);
  const gallery = (opts.currentGallery ?? []).filter(Boolean);
  const keepGalleryUrls = gallery.filter((u) =>
    isOurStorageUrl(u, opts.supabaseUrl),
  );
  const npsGallerySlots = gallery.filter((u) => isNpsGovUrl(u)).length;
  const galleryHasNps = npsGallerySlots > 0;

  // Bug 2 fix: already fully on our Storage → do nothing.
  if (heroOurs && !galleryHasNps) {
    return {
      heroStatus: "kept",
      uploadCandidateIndexes: [],
      keepHeroUrl: opts.currentHero ?? null,
      currentGalleryUrls: gallery,
      keepGalleryUrls,
      npsGallerySlots: 0,
      galleryReplaceNpsOnly: false,
      leaveRowAlone: true,
      noop: true,
      needsManualPhoto: false,
    };
  }

  // Hero ours but some gallery still on nps.gov → replace only those slots.
  if (heroOurs && galleryHasNps) {
    const need = Math.min(opts.goodCandidateCount, npsGallerySlots);
    const indexes = Array.from({ length: need }, (_, i) => i);
    if (opts.goodCandidateCount === 0) {
      // Cannot replace yet; leave row alone (keep Frank's hero + our gallery).
      return {
        heroStatus: "kept",
        uploadCandidateIndexes: [],
        keepHeroUrl: opts.currentHero ?? null,
        currentGalleryUrls: gallery,
        keepGalleryUrls,
        npsGallerySlots,
        galleryReplaceNpsOnly: true,
        leaveRowAlone: true,
        noop: false,
        needsManualPhoto: false,
      };
    }
    return {
      heroStatus: "kept",
      uploadCandidateIndexes: indexes,
      keepHeroUrl: opts.currentHero ?? null,
      currentGalleryUrls: gallery,
      keepGalleryUrls,
      npsGallerySlots,
      galleryReplaceNpsOnly: true,
      leaveRowAlone: false,
      noop: false,
      needsManualPhoto: false,
    };
  }

  if (opts.goodCandidateCount === 0) {
    return {
      heroStatus: "missing",
      uploadCandidateIndexes: [],
      keepHeroUrl: null,
      currentGalleryUrls: gallery,
      keepGalleryUrls,
      npsGallerySlots,
      galleryReplaceNpsOnly: false,
      leaveRowAlone: true,
      noop: false,
      needsManualPhoto: true,
    };
  }

  // Hero is nps.gov (or other non-Storage) → full replace with uploads.
  const indexes = Array.from({ length: opts.goodCandidateCount }, (_, i) => i);
  return {
    heroStatus: "replaced",
    uploadCandidateIndexes: indexes,
    keepHeroUrl: null,
    currentGalleryUrls: gallery,
    keepGalleryUrls,
    npsGallerySlots,
    galleryReplaceNpsOnly: false,
    leaveRowAlone: false,
    noop: false,
    needsManualPhoto: false,
  };
}

/**
 * After uploads, assemble the final hero + gallery URLs.
 * Never puts the hero URL into gallery_images.
 */
export function assembleMirroredUrls(opts: {
  heroStatus: HeroMirrorStatus;
  keepHeroUrl: string | null;
  keepGalleryUrls: string[];
  currentGalleryUrls?: string[];
  galleryReplaceNpsOnly?: boolean;
  uploadedUrls: string[];
  supabaseUrl?: string;
}): { hero: string | null; gallery: string[] } {
  if (opts.galleryReplaceNpsOnly && opts.heroStatus === "kept") {
    const hero = opts.keepHeroUrl;
    const uploads = [...opts.uploadedUrls];
    const out: string[] = [];
    for (const u of opts.currentGalleryUrls ?? []) {
      if (isNpsGovUrl(u)) {
        const next = uploads.shift();
        if (next && next !== hero) out.push(next);
        continue;
      }
      if (opts.supabaseUrl ? isOurStorageUrl(u, opts.supabaseUrl) : true) {
        if (u !== hero) out.push(u);
      } else if (u !== hero) {
        // Non-nps external: keep as-is (only nps.gov slots are replaced).
        out.push(u);
      }
    }
    return { hero, gallery: dedupeUrls(out) };
  }

  if (opts.heroStatus === "kept") {
    // Noop / leave-alone path — preserve gallery as kept Storage URLs only.
    const hero = opts.keepHeroUrl;
    const gallery = dedupeUrls(
      opts.keepGalleryUrls.filter((u) => u && u !== hero),
    );
    return { hero, gallery };
  }

  if (opts.heroStatus === "replaced" && opts.uploadedUrls.length > 0) {
    const [hero, ...rest] = opts.uploadedUrls;
    const gallery = dedupeUrls(
      [...opts.keepGalleryUrls, ...rest].filter((u) => u && u !== hero),
    );
    return { hero, gallery };
  }

  return {
    hero: opts.keepHeroUrl,
    gallery: dedupeUrls(
      opts.keepGalleryUrls.filter((u) => u && u !== opts.keepHeroUrl),
    ),
  };
}

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}
