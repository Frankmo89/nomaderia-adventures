import { describe, expect, it } from "vitest";
import {
  gallerySlide,
  heroSlides,
  nextHeroSlide,
  prevHeroSlide,
  seededRandom,
  storyStep,
  type GalleryHeroPhoto,
  type LocalHeroPhoto,
} from "./hero-slides";

const LOCAL: LocalHeroPhoto[] = [
  { id: "02", place: "Joshua Tree · California", alt: "a" },
  { id: "04", place: "Grand Canyon · Arizona", alt: "b" },
];
const SUPA = "https://x.supabase.co/storage/v1/object/public/media_gallery/abc.jpeg";

describe("heroSlides", () => {
  it("plays the local set while the gallery is empty or loading", () => {
    expect(heroSlides(LOCAL, undefined).map((s) => s.key)).toEqual(["local-02", "local-04"]);
    expect(heroSlides(LOCAL, []).map((s) => s.key)).toEqual(["local-02", "local-04"]);
  });

  it("keeps the local cover first, then the gallery in its order", () => {
    const slides = heroSlides(LOCAL, [
      { id: "g1", public_url: SUPA, caption: "Zion · Utah" },
      { id: "g2", public_url: SUPA, caption: null },
    ]);
    expect(slides.map((s) => s.key)).toEqual(["local-02", "gallery-g1", "gallery-g2"]);
  });

  const GALLERY: GalleryHeroPhoto[] = Array.from({ length: 30 }, (_, i) => ({
    id: `g${i}`,
    public_url: SUPA,
    caption: null,
  }));

  it("draws a few gallery photos per visit, after the cover", () => {
    const slides = heroSlides(LOCAL, GALLERY, { max: 7, random: seededRandom(42) });
    const keys = slides.map((s) => s.key);
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe("local-02");
    expect(new Set(keys).size).toBe(7);
    expect(keys.slice(1).every((k) => k.startsWith("gallery-"))).toBe(true);
  });

  it("keeps the same pick for the same seed and varies across seeds", () => {
    const pick = (seed: number) =>
      heroSlides(LOCAL, GALLERY, { max: 7, random: seededRandom(seed) }).map((s) => s.key).join();
    expect(pick(7)).toBe(pick(7));
    const seeds = [1, 2, 3, 4, 5].map(pick);
    expect(new Set(seeds).size).toBeGreaterThan(1);
  });

  it("shows every gallery photo when there are fewer than the cap", () => {
    const slides = heroSlides(LOCAL, GALLERY.slice(0, 3), { max: 7, random: seededRandom(1) });
    expect(slides).toHaveLength(4);
  });
});

describe("seededRandom", () => {
  it("stays in [0, 1)", () => {
    const r = seededRandom(123);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("storyStep", () => {
  const W = 390;
  it("taps on the left 30 % go back, elsewhere forward", () => {
    expect(storyStep({ dx: 0, dy: 0, x: 50, width: W })).toEqual({ direction: "prev", kind: "tap" });
    expect(storyStep({ dx: 3, dy: -4, x: 300, width: W })).toEqual({ direction: "next", kind: "tap" });
  });

  it("a sideways swipe steps the other way from the finger", () => {
    expect(storyStep({ dx: -80, dy: 10, x: 100, width: W })).toEqual({ direction: "next", kind: "swipe" });
    expect(storyStep({ dx: 80, dy: -10, x: 300, width: W })).toEqual({ direction: "prev", kind: "swipe" });
  });

  it("a scroll or a diagonal drag does nothing", () => {
    expect(storyStep({ dx: 5, dy: 120, x: 200, width: W })).toBeNull();
    expect(storyStep({ dx: 60, dy: 55, x: 200, width: W })).toBeNull();
    expect(storyStep({ dx: 20, dy: 0, x: 200, width: W })).toBeNull();
  });
});

describe("prevHeroSlide", () => {
  it("steps back and stays on the first", () => {
    expect([0, 1, 4].map(prevHeroSlide)).toEqual([0, 0, 3]);
  });
});

describe("gallerySlide", () => {
  it("asks Supabase for resized copies", () => {
    const s = gallerySlide({ id: "g1", public_url: SUPA, caption: "  Zion ·  Utah " });
    expect(s.src).toContain("/storage/v1/render/image/public/media_gallery/abc.jpeg");
    expect(s.src).toContain("width=1080");
    expect(s.srcSet.split(", ")).toHaveLength(3);
    expect(s.place).toBe("Zion · Utah");
    expect(s.alt).toBe("Foto de Zion · Utah");
  });

  it("hides the chip without a caption", () => {
    const s = gallerySlide({ id: "g2", public_url: SUPA, caption: "  " });
    expect(s.place).toBeNull();
    expect(s.alt).toBe("Foto de un parque nacional");
  });
});

describe("nextHeroSlide", () => {
  it("shows the cover once when there are gallery photos", () => {
    expect([0, 1, 2].map((i) => nextHeroSlide(i, 3, true))).toEqual([1, 2, 1]);
  });

  it("loops everything with local photos only", () => {
    expect([0, 1].map((i) => nextHeroSlide(i, 2, false))).toEqual([1, 0]);
  });

  it("stays put with a single slide", () => {
    expect(nextHeroSlide(0, 1, true)).toBe(0);
  });
});
