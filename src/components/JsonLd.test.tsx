import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import JsonLd from "./JsonLd";

afterEach(cleanup);

const renderJsonLd = (data: Record<string, unknown>) =>
  render(
    <HelmetProvider>
      <JsonLd data={data} />
    </HelmetProvider>
  );

describe("JsonLd", () => {
  it("renders a script tag with application/ld+json type", async () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "Place",
      name: "Machu Picchu",
    };

    renderJsonLd(data);

    await waitFor(() => {
      const scripts = document.querySelectorAll(
        'script[type="application/ld+json"]'
      );
      expect(scripts.length).toBeGreaterThanOrEqual(1);
      const match = Array.from(scripts).find((s) =>
        s.textContent?.includes("Machu Picchu")
      );
      expect(match).toBeTruthy();
      expect(JSON.parse(match!.textContent!)).toEqual(data);
    });
  });

  it("renders multiple JSON-LD blocks when used more than once", async () => {
    const destination = {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: "Camino Inca",
    };
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [],
    };

    render(
      <HelmetProvider>
        <JsonLd data={destination} />
        <JsonLd data={breadcrumb} />
      </HelmetProvider>
    );

    await waitFor(() => {
      const scripts = document.querySelectorAll(
        'script[type="application/ld+json"]'
      );
      expect(scripts.length).toBeGreaterThanOrEqual(2);
    });
  });
});
