/**
 * Repo paths that must never be embedded into knowledge_chunks.
 * eval/ is the live concierge exam (questions, gold answers, reports).
 * It is not a content source, is not served, and is not part of the Vite bundle.
 */
export const INGEST_IGNORE_PREFIXES = ["eval/"] as const;

export function isIngestIgnoredPath(path: string): boolean {
  const norm = path.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
  return INGEST_IGNORE_PREFIXES.some((prefix) => norm === prefix.slice(0, -1) || norm.startsWith(prefix));
}
