import { describe, expect, it } from "vitest";
import {
  MIN_IMAGE_BYTES,
  assembleMirroredUrls,
  creditLooksCopyrighted,
  destinationsPublicUrl,
  evaluateDownloadedImage,
  isNpsGovUrl,
  isOurStorageUrl,
  mirrorObjectPath,
  planMirrorWrite,
} from "@shared/mirror-park-images";

const SUPABASE = "https://vrixiuvnhvqafmxlcyex.supabase.co";
const STORAGE_HERO =
  `${SUPABASE}/storage/v1/object/public/destinations/nps/yosemite/0.jpg`;
const STORAGE_GALLERY =
  `${SUPABASE}/storage/v1/object/public/destinations/1772502898883-4w9ykr.jpeg`;
/** Real Kings Canyon gallery object in destinations_media (Frank's photos). */
const KINGS_MEDIA =
  `${SUPABASE}/storage/v1/object/public/destinations_media/378b59ce-33e5-489a-8680-c302cff4dd92.jpeg`;
/** Typical destinations-bucket mirror URL. */
const DESTINATIONS_BUCKET_URL =
  `${SUPABASE}/storage/v1/object/public/destinations/nps/redwood-national-park/0.jpg`;
const NPS_URL =
  "https://www.nps.gov/common/uploads/structured_data/abc.jpg";

describe("isOurStorageUrl", () => {
  it("accepts public destinations URLs on this project host", () => {
    expect(isOurStorageUrl(STORAGE_HERO, SUPABASE)).toBe(true);
    expect(isOurStorageUrl(STORAGE_GALLERY, SUPABASE)).toBe(true);
    expect(isOurStorageUrl(DESTINATIONS_BUCKET_URL, SUPABASE)).toBe(true);
  });

  it("accepts destinations_media URLs (Kings Canyon / Redwood galleries)", () => {
    expect(isOurStorageUrl(KINGS_MEDIA, SUPABASE)).toBe(true);
    expect(
      isOurStorageUrl(
        `${SUPABASE}/storage/v1/object/public/destinations_media/redwood-shot.jpeg`,
        SUPABASE,
      ),
    ).toBe(true);
  });

  it("accepts signed Storage URLs on this host", () => {
    expect(
      isOurStorageUrl(
        `${SUPABASE}/storage/v1/object/sign/destinations_media/x.jpeg?token=abc`,
        SUPABASE,
      ),
    ).toBe(true);
  });

  it("rejects nps.gov and other hosts", () => {
    expect(isOurStorageUrl(NPS_URL, SUPABASE)).toBe(false);
    expect(
      isOurStorageUrl(
        "https://other.supabase.co/storage/v1/object/public/destinations/x.jpg",
        SUPABASE,
      ),
    ).toBe(false);
  });

  it("handles null/empty", () => {
    expect(isOurStorageUrl(null, SUPABASE)).toBe(false);
    expect(isOurStorageUrl("", SUPABASE)).toBe(false);
  });
});

describe("isNpsGovUrl", () => {
  it("detects www.nps.gov structured_data URLs", () => {
    expect(isNpsGovUrl(NPS_URL)).toBe(true);
    expect(isNpsGovUrl("https://nps.gov/foo.jpg")).toBe(true);
  });

  it("rejects our Storage and unrelated hosts", () => {
    expect(isNpsGovUrl(KINGS_MEDIA)).toBe(false);
    expect(isNpsGovUrl(STORAGE_HERO)).toBe(false);
    expect(isNpsGovUrl(null)).toBe(false);
  });
});

describe("creditLooksCopyrighted", () => {
  it("flags © and copyright (case-insensitive)", () => {
    expect(creditLooksCopyrighted("Photo © Jane Doe")).toBe(true);
    expect(creditLooksCopyrighted("Copyright NPS")).toBe(true);
    expect(creditLooksCopyrighted("COPYRIGHT 2020")).toBe(true);
  });

  it("allows public-domain-style credits", () => {
    expect(creditLooksCopyrighted("NPS / Jane Doe")).toBe(false);
    expect(creditLooksCopyrighted(null)).toBe(false);
    expect(creditLooksCopyrighted("")).toBe(false);
  });
});

describe("evaluateDownloadedImage", () => {
  it("skips failed downloads", () => {
    expect(
      evaluateDownloadedImage({
        downloadOk: false,
        contentType: "image/jpeg",
        byteLength: 100_000,
      }),
    ).toBe("download_failed");
  });

  it("skips non-image content types", () => {
    expect(
      evaluateDownloadedImage({
        downloadOk: true,
        contentType: "text/html",
        byteLength: 100_000,
      }),
    ).toBe("not_image");
  });

  it("skips images under 20 KB", () => {
    expect(
      evaluateDownloadedImage({
        downloadOk: true,
        contentType: "image/jpeg",
        byteLength: MIN_IMAGE_BYTES - 1,
      }),
    ).toBe("too_small");
  });

  it("skips copyrighted credits", () => {
    expect(
      evaluateDownloadedImage({
        downloadOk: true,
        contentType: "image/jpeg",
        byteLength: 100_000,
        credit: "© Artist",
      }),
    ).toBe("copyrighted");
  });

  it("accepts a healthy JPEG", () => {
    expect(
      evaluateDownloadedImage({
        downloadOk: true,
        contentType: "image/jpeg; charset=binary",
        byteLength: MIN_IMAGE_BYTES,
        credit: "NPS Photo",
      }),
    ).toBeNull();
  });
});

describe("mirrorObjectPath / destinationsPublicUrl", () => {
  it("builds the documented public URL shape", () => {
    expect(mirrorObjectPath("yosemite", 0)).toBe("nps/yosemite/0.jpg");
    expect(destinationsPublicUrl(SUPABASE, "nps/yosemite/0.jpg")).toBe(
      STORAGE_HERO,
    );
  });
});

describe("planMirrorWrite + assembleMirroredUrls", () => {
  it("noops when hero and gallery are already our Storage (incl. destinations_media)", () => {
    const plan = planMirrorWrite({
      currentHero: DESTINATIONS_BUCKET_URL,
      currentGallery: [KINGS_MEDIA, STORAGE_GALLERY],
      goodCandidateCount: 6,
      supabaseUrl: SUPABASE,
    });
    expect(plan.noop).toBe(true);
    expect(plan.heroStatus).toBe("kept");
    expect(plan.leaveRowAlone).toBe(true);
    expect(plan.uploadCandidateIndexes).toEqual([]);
    expect(plan.keepGalleryUrls).toEqual([KINGS_MEDIA, STORAGE_GALLERY]);
  });

  it("reports missing + needs manual when nothing works", () => {
    const plan = planMirrorWrite({
      currentHero: NPS_URL,
      currentGallery: [NPS_URL],
      goodCandidateCount: 0,
      supabaseUrl: SUPABASE,
    });
    expect(plan.heroStatus).toBe("missing");
    expect(plan.needsManualPhoto).toBe(true);
    expect(plan.leaveRowAlone).toBe(true);
  });

  it("replaces nps.gov hero with uploaded URLs and preserves Storage gallery", () => {
    const plan = planMirrorWrite({
      currentHero: NPS_URL,
      currentGallery: [STORAGE_GALLERY, NPS_URL, KINGS_MEDIA],
      goodCandidateCount: 3,
      supabaseUrl: SUPABASE,
    });
    expect(plan.heroStatus).toBe("replaced");
    expect(plan.keepGalleryUrls).toEqual([STORAGE_GALLERY, KINGS_MEDIA]);
    expect(plan.noop).toBe(false);

    const assembled = assembleMirroredUrls({
      heroStatus: "replaced",
      keepHeroUrl: null,
      keepGalleryUrls: plan.keepGalleryUrls,
      uploadedUrls: [
        `${SUPABASE}/storage/v1/object/public/destinations/nps/acadia/0.jpg`,
        `${SUPABASE}/storage/v1/object/public/destinations/nps/acadia/1.jpg`,
        `${SUPABASE}/storage/v1/object/public/destinations/nps/acadia/2.jpg`,
      ],
    });
    expect(assembled.hero).toContain("/nps/acadia/0.jpg");
    expect(assembled.gallery).not.toContain(assembled.hero);
    expect(assembled.gallery[0]).toBe(STORAGE_GALLERY);
    expect(assembled.gallery).toContain(KINGS_MEDIA);
  });

  it("when hero is ours, replaces only nps.gov gallery slots and never puts hero in gallery", () => {
    const hero = STORAGE_HERO;
    const plan = planMirrorWrite({
      currentHero: hero,
      currentGallery: [KINGS_MEDIA, NPS_URL, STORAGE_GALLERY],
      goodCandidateCount: 4,
      supabaseUrl: SUPABASE,
    });
    expect(plan.heroStatus).toBe("kept");
    expect(plan.galleryReplaceNpsOnly).toBe(true);
    expect(plan.noop).toBe(false);
    expect(plan.uploadCandidateIndexes).toEqual([0]); // one nps.gov slot

    const replacement =
      `${SUPABASE}/storage/v1/object/public/destinations/nps/yosemite/1.jpg`;
    const assembled = assembleMirroredUrls({
      heroStatus: "kept",
      keepHeroUrl: hero,
      keepGalleryUrls: plan.keepGalleryUrls,
      currentGalleryUrls: plan.currentGalleryUrls,
      galleryReplaceNpsOnly: true,
      uploadedUrls: [replacement],
      supabaseUrl: SUPABASE,
    });
    expect(assembled.hero).toBe(hero);
    expect(assembled.gallery).toEqual([KINGS_MEDIA, replacement, STORAGE_GALLERY]);
    expect(assembled.gallery).not.toContain(hero);
  });

  it("is idempotent: planning twice on the same mirrored row yields the same row", () => {
    const firstPlan = planMirrorWrite({
      currentHero: NPS_URL,
      currentGallery: [NPS_URL, NPS_URL],
      goodCandidateCount: 3,
      supabaseUrl: SUPABASE,
    });
    const uploaded = [
      `${SUPABASE}/storage/v1/object/public/destinations/nps/zion/0.jpg`,
      `${SUPABASE}/storage/v1/object/public/destinations/nps/zion/1.jpg`,
      `${SUPABASE}/storage/v1/object/public/destinations/nps/zion/2.jpg`,
    ];
    const first = assembleMirroredUrls({
      heroStatus: firstPlan.heroStatus,
      keepHeroUrl: firstPlan.keepHeroUrl,
      keepGalleryUrls: firstPlan.keepGalleryUrls,
      currentGalleryUrls: firstPlan.currentGalleryUrls,
      galleryReplaceNpsOnly: firstPlan.galleryReplaceNpsOnly,
      uploadedUrls: uploaded,
      supabaseUrl: SUPABASE,
    });

    const secondPlan = planMirrorWrite({
      currentHero: first.hero,
      currentGallery: first.gallery,
      goodCandidateCount: 6,
      supabaseUrl: SUPABASE,
    });
    expect(secondPlan.noop).toBe(true);
    expect(secondPlan.leaveRowAlone).toBe(true);
    expect(secondPlan.uploadCandidateIndexes).toEqual([]);

    const second = assembleMirroredUrls({
      heroStatus: secondPlan.heroStatus,
      keepHeroUrl: secondPlan.keepHeroUrl,
      keepGalleryUrls: secondPlan.keepGalleryUrls,
      currentGalleryUrls: secondPlan.currentGalleryUrls,
      galleryReplaceNpsOnly: secondPlan.galleryReplaceNpsOnly,
      uploadedUrls: [],
      supabaseUrl: SUPABASE,
    });
    expect(second.hero).toBe(first.hero);
    expect(second.gallery).toEqual(first.gallery);
    expect(second.gallery).not.toContain(second.hero);
  });
});
