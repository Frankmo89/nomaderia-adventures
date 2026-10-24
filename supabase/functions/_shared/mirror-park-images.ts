// supabase/functions/_shared/mirror-park-images.ts
// Pure helpers for mirror-park-images (ADR-057). Shared by Deno edge + Vitest (@shared).

/** Minimum download size — tiny files are usually broken/placeholder. */
export const MIN_IMAGE_BYTES = 20 * 1024;

/** Cap per park (edge time limit + gallery size). */
export const MAX_PARK_IMAGES = 6;

/** Storage bucket that holds destination photos. */
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
 * True when `url` is a public object in this project's `destinations` Storage bucket.
 * Shape: `{SUPABASE_URL}/storage/v1/object/public/destinations/...`
 * Also accepts the `/storage/v1/object/sign/destinations/` form just in case.
 */
export function isOurDestinationsStorageUrl(
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
      path.includes(`/storage/v1/object/public/${DESTINATIONS_BUCKET}/`) ||
      path.includes(`/storage/v1/object/sign/${DESTINATIONS_BUCKET}/`)
    );
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
  /** Candidate indices (into the good-candidates array) to upload for hero+gallery. Empty if leave-alone. */
  uploadCandidateIndexes: number[];
  /** Final hero URL to write (existing Storage URL, or null if missing / leave alone). */
  keepHeroUrl: string | null;
  /** Existing gallery URLs that already point at our Storage (preserved). */
  keepGalleryUrls: string[];
  /** Leave the destinations row untouched (no working photo to write). */
  leaveRowAlone: boolean;
  needsManualPhoto: boolean;
}

/**
 * Plan what to write given current DB URLs and how many good NPS candidates we have.
 * Never replaces a URL that already points at our Storage.
 */
export function planMirrorWrite(opts: {
  currentHero: string | null | undefined;
  currentGallery: string[] | null | undefined;
  goodCandidateCount: number;
  supabaseUrl: string;
}): MirrorPlan {
  const heroOurs = isOurDestinationsStorageUrl(opts.currentHero, opts.supabaseUrl);
  const gallery = (opts.currentGallery ?? []).filter(Boolean);
  const keepGalleryUrls = gallery.filter((u) =>
    isOurDestinationsStorageUrl(u, opts.supabaseUrl),
  );

  if (opts.goodCandidateCount === 0) {
    if (heroOurs) {
      return {
        heroStatus: "kept",
        uploadCandidateIndexes: [],
        keepHeroUrl: opts.currentHero ?? null,
        keepGalleryUrls,
        leaveRowAlone: true,
        needsManualPhoto: false,
      };
    }
    return {
      heroStatus: "missing",
      uploadCandidateIndexes: [],
      keepHeroUrl: null,
      keepGalleryUrls,
      leaveRowAlone: true,
      needsManualPhoto: true,
    };
  }

  // We have at least one good candidate to upload.
  const indexes = Array.from({ length: opts.goodCandidateCount }, (_, i) => i);

  if (heroOurs) {
    return {
      heroStatus: "kept",
      uploadCandidateIndexes: indexes,
      keepHeroUrl: opts.currentHero ?? null,
      keepGalleryUrls,
      leaveRowAlone: false,
      needsManualPhoto: false,
    };
  }

  return {
    heroStatus: "replaced",
    uploadCandidateIndexes: indexes,
    keepHeroUrl: null,
    keepGalleryUrls,
    leaveRowAlone: false,
    needsManualPhoto: false,
  };
}

/**
 * After uploads, assemble the final hero + gallery URLs.
 * `uploadedUrls` are in candidate order (index 0 = first good NPS image).
 */
export function assembleMirroredUrls(opts: {
  heroStatus: HeroMirrorStatus;
  keepHeroUrl: string | null;
  keepGalleryUrls: string[];
  uploadedUrls: string[];
}): { hero: string | null; gallery: string[] } {
  if (opts.heroStatus === "kept") {
    // All uploads go to gallery; preserve existing Storage gallery entries first.
    const gallery = dedupeUrls([...opts.keepGalleryUrls, ...opts.uploadedUrls]);
    return { hero: opts.keepHeroUrl, gallery };
  }
  if (opts.heroStatus === "replaced" && opts.uploadedUrls.length > 0) {
    const [hero, ...rest] = opts.uploadedUrls;
    const gallery = dedupeUrls([...opts.keepGalleryUrls, ...rest]);
    return { hero, gallery };
  }
  return { hero: opts.keepHeroUrl, gallery: opts.keepGalleryUrls };
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
