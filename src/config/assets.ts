/**
 * Centralised brand assets.
 * Change the values here and every runtime TS/React page or component will pick them up automatically.
 * NOTE: index.html meta tags must be updated manually — see the sync comments there.
 */
export const BRAND_ASSETS = {
  // TODO: Pegar aquí la URL del logo final una vez subido a Supabase.
  /** URL of the site logo asset. */
  logo: "",

  /** Default Open-Graph / Twitter Card image when a page-specific image is not provided. */
  defaultOgImage:
    "https://vrixiuvnhvqafmxlcyex.supabase.co/storage/v1/object/public/destinations/1772502898883-4w9ykr.jpeg",
} as const;
