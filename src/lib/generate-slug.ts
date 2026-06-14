// Duplicated in supabase/functions/_shared/generate-slug.ts because
// edge functions run in Deno and cannot import from src/.
// Keep both files in sync when changing this logic.
export function generateFriendlySlug(
  clientName: string,
  parkTitle: string,
): string {
  const normalizeSegment = (s: string, fallback: string): string => {
    const result = s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 20);
    return result || fallback;
  };

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${normalizeSegment(clientName, "c")}-${normalizeSegment(parkTitle, "p")}-${suffix}`;
}
