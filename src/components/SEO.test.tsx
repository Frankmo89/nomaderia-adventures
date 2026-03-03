import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import SEO from "./SEO";

afterEach(cleanup);

const renderSEO = (props: { title: string; description: string; image?: string; slug: string }) => {
  const ctx = {};
  return render(
    <HelmetProvider context={ctx}>
      <SEO {...props} />
    </HelmetProvider>
  );
};

describe("SEO", () => {
  it("renders with provided props without throwing", () => {
    expect(() =>
      renderSEO({
        title: "Camino Inca",
        description: "Guía completa del Camino Inca",
        image: "https://example.com/inca.jpg",
        slug: "destinos/camino-inca",
      })
    ).not.toThrow();
  });

  it("renders without image prop (uses default) without throwing", () => {
    expect(() =>
      renderSEO({
        title: "Destino",
        description: "Descripción",
        slug: "destinos/test",
      })
    ).not.toThrow();
  });
});
