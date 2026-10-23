import { describe, expect, it } from "vitest";
import { gallerySlide, heroSlides, nextHeroSlide, type LocalHeroPhoto } from "./hero-slides";

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
