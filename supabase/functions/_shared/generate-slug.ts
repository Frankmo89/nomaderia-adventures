export function generateFriendlySlug(
  clientName: string,
  parkTitle: string,
): string {
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 20);

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${normalize(clientName)}-${normalize(parkTitle)}-${suffix}`;
}
