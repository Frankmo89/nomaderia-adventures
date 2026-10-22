import { describe, expect, it } from "vitest";
import { hasHeroForPath } from "./hero-routes";

describe("hasHeroForPath", () => {
  it("is true where a dark band sits behind the navbar", () => {
    for (const path of ["/", "/calculadora", "/servicios", "/destinos", "/blog", "/gear", "/sobre-nosotros"]) {
      expect(hasHeroForPath(path)).toBe(true);
    }
  });

  it("is false on destination detail pages (photo starts below the navbar)", () => {
    expect(hasHeroForPath("/destinos/pinnacles-national-park")).toBe(false);
    expect(hasHeroForPath("/destinos/yosemite")).toBe(false);
  });

  it("is false on article pages and unknown routes", () => {
    expect(hasHeroForPath("/blog/mi-primer-viaje")).toBe(false);
    expect(hasHeroForPath("/gear/botas")).toBe(false);
    expect(hasHeroForPath("/gracias")).toBe(false);
  });
});
