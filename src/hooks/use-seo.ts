import { useEffect } from "react";
import { useLocation } from "react-router-dom";

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
}

/**
 * Updates document title and meta tags for the current page.
 * Restores the default title on unmount.
 */
export const usePageMeta = ({ title, description, image, type = "website" }: PageMeta) => {
  useEffect(() => {
    const fullTitle = `${title} — Nomaderia`;
    document.title = fullTitle;

    const setMeta = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:type"]', "content", type);
    if (image) {
      setMeta('meta[property="og:image"]', "content", image);
      setMeta('meta[name="twitter:image"]', "content", image);
    }

    return () => {
      document.title = "Nomaderia — Tu Primera Aventura Te Está Esperando";
    };
  }, [title, description, image, type]);
};

export { SITE_URL };
