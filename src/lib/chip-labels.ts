const SLUG_MAP: Record<string, string> = {
  "parque-nacional": "Parque Nacional",
  "experiencia-unica": "Experiencia única",
  "experiencia-única": "Experiencia única",
  "sin-carro": "Sin carro",
  "todo-el-año": "Todo el año",
  "todo-el-ano": "Todo el año",
  "alta-sierra": "Alta Sierra",
  "fotografía": "Fotografía",
  "fotografia": "Fotografía",
  "volcan": "Volcán",
  "volcán": "Volcán",
};

// Slugs that carry no display value on their own
const SKIP = new Set([
  "en", "el", "la", "de", "un", "al", "los", "las",
]);

function toTitleCase(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function formatChipLabel(raw: string): string {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (SLUG_MAP[lower]) return SLUG_MAP[lower];
  return lower.split("-").map(toTitleCase).join(" ");
}

export function buildChipItems(
  goodFor: string[] | null | undefined,
  tags: string[] | null | undefined,
  max = 8,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  const add = (arr: string[] | null | undefined) => {
    for (const raw of arr ?? []) {
      if (result.length >= max) return;
      const trimmed = raw?.trim();
      if (!trimmed) continue;
      // Skip very short single words with no hyphens
      if (trimmed.length <= 3 && !trimmed.includes("-")) continue;
      if (SKIP.has(trimmed.toLowerCase())) continue;
      const label = formatChipLabel(trimmed);
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(label);
    }
  };

  add(goodFor);
  add(tags);
  return result;
}
