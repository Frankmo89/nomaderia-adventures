import { describe, it, expect, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useCanonical, useJsonLd } from "./use-seo";

describe("useCanonical", () => {
  afterEach(() => {
    const link = document.querySelector('link[rel="canonical"]');
    if (link) link.remove();
  });

  it("should create a canonical link element with the correct href", () => {
    renderHook(() => useCanonical(), {
      wrapper: ({ children }) =>
        MemoryRouter({ initialEntries: ["/destinos/camino-inca"], children }),
    });

    const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute("href")).toContain("/destinos/camino-inca");
  });

  it("should use window.location.origin as fallback when VITE_SITE_URL is not set", () => {
    renderHook(() => useCanonical(), {
      wrapper: ({ children }) =>
        MemoryRouter({ initialEntries: ["/blog"], children }),
    });

    const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(link).toBeTruthy();
    // In jsdom, window.location.origin is "http://localhost"
    expect(link?.getAttribute("href")).toMatch(/^https?:\/\/.+\/blog$/);
  });
});

describe("useJsonLd", () => {
  afterEach(() => {
    document.querySelectorAll('script[data-jsonld]').forEach((el) => el.remove());
  });

  it("should inject a JSON-LD script tag", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "Article",
      name: "Test Article",
    };

    const { unmount } = renderHook(() => useJsonLd(data));

    const script = document.querySelector('script[data-jsonld]');
    expect(script).toBeTruthy();
    expect(script?.getAttribute("type")).toBe("application/ld+json");
    expect(JSON.parse(script?.textContent || "{}")).toEqual(data);

    unmount();
    expect(document.querySelector('script[data-jsonld]')).toBeNull();
  });

  it("should not inject a script tag when data is null", () => {
    renderHook(() => useJsonLd(null));
    expect(document.querySelector('script[data-jsonld]')).toBeNull();
  });
});
