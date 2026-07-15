import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BRAND_ASSETS } from "@/config/assets";

const envSiteUrl = import.meta.env.VITE_SITE_URL;
// Treat an empty string (or missing value) as "unset" so we fall back to the production URL.
const SITE_URL =
  envSiteUrl && envSiteUrl.trim() !== ""
    ? envSiteUrl
    : "https://nomaderia.com";

/**
 * Sets a canonical link and cleans up on unmount.
 * Also sets JSON-LD structured data if provided.
 */
export const useCanonical = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", `${SITE_URL}${pathname}`);

    return () => {
      // Don't remove — next route will update it
    };
  }, [pathname]);
};

/**
 * Injects a JSON-LD script tag and removes it on unmount.
 */
export const useJsonLd = (data: Record<string, unknown> | null) => {
  useEffect(() => {
    if (!data) return;

    const script = document.createElement("script");
    script.setAttribute("type", "application/ld+json");
    script.setAttribute("data-jsonld", "true");
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [data]);
};

interface PageMeta {
  title: string;
  description: string;
  image?: string;
  type?: string;
  robots?: string;
}

/**
 * Updates document title and meta tags for the current page.
 * Restores the default title on unmount.
 */
export const usePageMeta = ({
  title,
  description,
  image,
  type = "website",
  robots = "index, follow",
}: PageMeta) => {
  useEffect(() => {
    const fullTitle = `${title} — Nomaderia`;
    document.title = fullTitle;

    const setMeta = (
      selector: string,
      metaAttr: "name" | "property",
      key: string,
      value: string,
    ) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(metaAttr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };

    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[name="robots"]', "name", "robots", robots);
    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:type"]', "property", "og:type", type);
    if (image) {
      setMeta('meta[property="og:image"]', "property", "og:image", image);
      setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    }

    return () => {
      document.title = "Nomaderia - Aventuras y Senderismo";
    };
  }, [title, description, image, type, robots]);
};

/** Re-export the default OG image from the centralised brand-assets config. */
const DEFAULT_OG_IMAGE = BRAND_ASSETS.defaultOgImage;

export { SITE_URL, DEFAULT_OG_IMAGE };
