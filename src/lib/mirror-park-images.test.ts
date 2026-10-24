import { describe, expect, it } from "vitest";
import {
  MIN_IMAGE_BYTES,
  assembleMirroredUrls,
  creditLooksCopyrighted,
  destinationsPublicUrl,
  evaluateDownloadedImage,
  isOurDestinationsStorageUrl,
  mirrorObjectPath,
  planMirrorWrite,
} from "@shared/mirror-park-images";

const SUPABASE = "https://vrixiuvnhvqafmxlcyex.supabase.co";
const STORAGE_HERO =
  `${SUPABASE}/storage/v1/object/public/destinations/nps/yosemite/0.jpg`;
const STORAGE_GALLERY =
  `${SUPABASE}/storage/v1/object/public/destinations/1772502898883-4w9ykr.jpeg`;
const NPS_URL =
  "https://www.nps.gov/common/uploads/structured_data/abc.jpg";

describe("isOurDestinationsStorageUrl", () => {
  it("accepts public destinations URLs on this project host", () => {
    expect(isOurDestinationsStorageUrl(STORAGE_HERO, SUPABASE)).toBe(true);
    expect(isOurDestinationsStorageUrl(STORAGE_GALLERY, SUPABASE)).toBe(true);
  });

  it("rejects nps.gov and other hosts", () => {
    expect(isOurDestinationsStorageUrl(NPS_URL, SUPABASE)).toBe(false);
    expect(
      isOurDestinationsStorageUrl(
        "https://other.supabase.co/storage/v1/object/public/destinations/x.jpg",
        SUPABASE,
      ),
    ).toBe(false);
  });

  it("rejects other buckets on the same host", () => {
    expect(
      isOurDestinationsStorageUrl(
        `${SUPABASE}/storage/v1/object/public/media_gallery/x.jpg`,
        SUPABASE,
      ),
    ).toBe(false);
  });

  it("handles null/empty", () => {
    expect(isOurDestinationsStorageUrl(null, SUPABASE)).toBe(false);
    expect(isOurDestinationsStorageUrl("", SUPABASE)).toBe(false);
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
  it("keeps Frank's Storage hero and leaves the row alone when no candidates", () => {
    const plan = planMirrorWrite({
      currentHero: STORAGE_HERO,
      currentGallery: [STORAGE_GALLERY],
      goodCandidateCount: 0,
      supabaseUrl: SUPABASE,
    });
    expect(plan.heroStatus).toBe("kept");
    expect(plan.leaveRowAlone).toBe(true);
    expect(plan.needsManualPhoto).toBe(false);
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
      currentGallery: [STORAGE_GALLERY, NPS_URL],
      goodCandidateCount: 3,
      supabaseUrl: SUPABASE,
    });
    expect(plan.heroStatus).toBe("replaced");
    expect(plan.keepGalleryUrls).toEqual([STORAGE_GALLERY]);

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
    expect(assembled.gallery[0]).toBe(STORAGE_GALLERY);
    expect(assembled.gallery).toHaveLength(3);
  });

  it("keeps Storage hero and puts all uploads into gallery", () => {
    const assembled = assembleMirroredUrls({
      heroStatus: "kept",
      keepHeroUrl: STORAGE_HERO,
      keepGalleryUrls: [],
      uploadedUrls: [
        `${SUPABASE}/storage/v1/object/public/destinations/nps/redwood/0.jpg`,
        `${SUPABASE}/storage/v1/object/public/destinations/nps/redwood/1.jpg`,
      ],
    });
    expect(assembled.hero).toBe(STORAGE_HERO);
    expect(assembled.gallery).toHaveLength(2);
  });
});
