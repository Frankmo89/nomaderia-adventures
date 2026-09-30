import { staticFile } from "remotion";

/** Resolve scene src: remote URL as-is, otherwise a file under video/public/. */
export function resolveSrc(src?: string): string | null {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  const cleaned = src.replace(/^\.?\//, "");
  return staticFile(cleaned);
}
