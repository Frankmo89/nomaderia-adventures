import { describe, expect, it } from "vitest";
import { resizedImageUrl } from "./resized-image";

describe("resizedImageUrl", () => {
  it("rewrites Supabase object URLs to render/image with width", () => {
    const src =
      "https://vrixiuvnhvqafmxlcyex.supabase.co/storage/v1/object/public/media_gallery/abc.jpeg";
    const out = resizedImageUrl(src, 400, { quality: 70 });
    expect(out).toContain("/storage/v1/render/image/public/media_gallery/abc.jpeg");
    expect(out).toContain("width=400");
    expect(out).toContain("quality=70");
    expect(out).toContain("resize=cover");
  });

  it("sets Unsplash w/q params", () => {
    const out = resizedImageUrl(
      "https://images.unsplash.com/photo-123?w=800&q=80",
      640,
    );
    expect(out).toContain("w=640");
    expect(out).toContain("q=70");
  });

  it("leaves nps.gov URLs unchanged", () => {
    const src =
      "https://www.nps.gov/common/uploads/structured_data/abc.jpg";
    expect(resizedImageUrl(src, 640)).toBe(src);
  });

  it("returns empty string for nullish", () => {
    expect(resizedImageUrl(null, 100)).toBe("");
    expect(resizedImageUrl(undefined, 100)).toBe("");
  });
});
