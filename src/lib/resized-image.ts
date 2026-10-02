/**
 * Resize remote images where the CDN supports it (Supabase Image
 * Transformations + Unsplash). Other hosts (e.g. nps.gov) are returned
 * unchanged — "where practical" for homepage LCP work.
 */
export function resizedImageUrl(
  url: string | null | undefined,
  width: number,
  opts: { quality?: number; height?: number } = {},
): string {
  if (!url) return "";
  const quality = opts.quality ?? 70;

  // Supabase Storage: /object/public/... → /render/image/public/...?width=
  const supabaseObject = "/storage/v1/object/public/";
  const supabaseRender = "/storage/v1/render/image/public/";
  if (url.includes(supabaseObject) || url.includes(supabaseRender)) {
    const base = url.includes(supabaseObject)
      ? url.replace(supabaseObject, supabaseRender)
      : url;
    try {
      const parsed = new URL(base);
      parsed.searchParams.set("width", String(width));
      parsed.searchParams.set("quality", String(quality));
      parsed.searchParams.set("resize", "cover");
      if (opts.height) parsed.searchParams.set("height", String(opts.height));
      return parsed.toString();
    } catch {
      return url;
    }
  }

  // Unsplash: w= / q= query params
  if (url.includes("images.unsplash.com")) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", String(quality));
      parsed.searchParams.set("auto", "format");
      if (opts.height) parsed.searchParams.set("h", String(opts.height));
      return parsed.toString();
    } catch {
      return url;
    }
  }

  return url;
}
