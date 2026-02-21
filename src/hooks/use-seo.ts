import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const envSiteUrl = import.meta.env.VITE_SITE_URL;
// Treat an empty string (or missing value) as "unset" so we fall back to window.location.origin.
const SITE_URL =
  envSiteUrl && envSiteUrl.trim() !== ""
    ? envSiteUrl
    : typeof window !== "undefined"
      ? window.location.origin
      : "";

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
export const useJsonLd = (data: Record<string, any> | null) => {
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
