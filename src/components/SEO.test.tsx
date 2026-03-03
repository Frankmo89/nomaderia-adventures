import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import SEO from "./SEO";

afterEach(cleanup);

const renderSEO = (props: { title: string; description: string; image?: string; slug: string }) =>
  render(
    <HelmetProvider>
      <SEO {...props} />
    </HelmetProvider>
  );

describe("SEO", () => {
  it("injects title and meta tags from provided props", async () => {
    renderSEO({
      title: "Camino Inca",
      description: "Guía completa del Camino Inca",
      image: "https://example.com/inca.jpg",
      slug: "destinos/camino-inca",
    });

    await waitFor(() => {
      expect(document.title).toContain("Camino Inca");
    });

    const descriptionMeta = document.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement | null;
    expect(descriptionMeta).not.toBeNull();
    expect(descriptionMeta?.content).toBe("Guía completa del Camino Inca");

    const ogImageMeta = document.querySelector(
      'meta[property="og:image"]'
    ) as HTMLMetaElement | null;
    expect(ogImageMeta).not.toBeNull();
    expect(ogImageMeta?.content).toBe("https://example.com/inca.jpg");
  });

  it("uses a default og:image when image prop is not provided", async () => {
    renderSEO({
      title: "Destino",
      description: "Descripción",
      slug: "destinos/test",
    });

    await waitFor(() => {
      expect(document.title).toContain("Destino");
    });

    const ogImageMeta = document.querySelector(
      'meta[property="og:image"]'
    ) as HTMLMetaElement | null;
    expect(ogImageMeta).not.toBeNull();
    expect(ogImageMeta?.content).toBeTruthy();
  });
});
