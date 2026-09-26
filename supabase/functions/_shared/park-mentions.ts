/**
 * Detects which catalog parks a piece of text names — the backstop half of the
 * concierge's answer check (contract §6.1: recommend only engine-returned
 * parks). The primary signal is the model's own `parks_mentioned` list; this
 * scan catches a park the model named but forgot to declare.
 *
 * Matching is accent- and case-insensitive on whole words. Aliases come from
 * the engine catalog (English) and published `destinations` titles (Spanish).
 * Longer aliases are matched first and consume their span, so "Glacier Bay"
 * is never also counted as "Glacier".
 */

/** Short names that are also ordinary words/phrases; only their full park name counts. */
const AMBIGUOUS_SHORT_NAMES = new Set([
  "badlands",
  "gran canon",
  "great basin",
  "hot springs",
  "joshua tree",
  "montanas rocosas",
  "redwood",
  "saguaro",
  "sequoia",
]);

export interface ParkNameSource {
  park_code: string;
  name: string;
}

export interface ParkNameIndex {
  /** Normalized alias → park_code, longest alias first. */
  aliases: Array<[string, string]>;
  codes: Set<string>;
}

export function normalizeForMatch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function shortEnglish(name: string): string {
  return name
    .replace(/^national park of (the )?/, "")
    .replace(/ national parks?( and preserve)?$/, "")
    .trim();
}

function shortSpanish(title: string): string {
  return title.replace(/^parque nacional( y reserva)?( de la| del| de)? /, "").trim();
}

/** Build aliases from catalog names (English) and destination titles (Spanish). */
export function buildParkNameIndex(sources: ParkNameSource[]): ParkNameIndex {
  const byAlias = new Map<string, string>();
  const codes = new Set<string>();
  const add = (alias: string, code: string, isShort: boolean) => {
    if (!alias || (isShort && AMBIGUOUS_SHORT_NAMES.has(alias))) return;
    if (!byAlias.has(alias)) byAlias.set(alias, code);
  };
  for (const { park_code, name } of sources) {
    const code = park_code.toLowerCase();
    codes.add(code);
    const full = normalizeForMatch(name);
    add(full, code, false);
    add(shortEnglish(full), code, true);
    add(shortSpanish(full), code, true);
  }
  const aliases = [...byAlias.entries()].sort((a, b) => b[0].length - a[0].length);
  return { aliases, codes };
}

/** Park codes named in `text`. */
export function findParkMentions(text: string, index: ParkNameIndex): Set<string> {
  let haystack = ` ${normalizeForMatch(text)} `;
  const found = new Set<string>();
  for (const [alias, code] of index.aliases) {
    const needle = ` ${alias} `;
    if (haystack.includes(needle)) {
      found.add(code);
      haystack = haystack.split(needle).join(" # ");
    }
  }
  return found;
}

/**
 * Parks an answer names (declared by the model or found in its text) that are
 * not in `allowed`. Empty array = the answer passes the check.
 */
export function findUnbackedParks(
  answer: string,
  declaredCodes: readonly string[],
  allowed: ReadonlySet<string>,
  index: ParkNameIndex,
): string[] {
  const mentioned = findParkMentions(answer, index);
  for (const code of declaredCodes) {
    const c = String(code).toLowerCase();
    if (index.codes.has(c)) mentioned.add(c);
  }
  return [...mentioned].filter((c) => !allowed.has(c)).sort();
}
