/**
 * Official NPS pages ingested into knowledge_chunks (ADR-036).
 *
 * Pure module: page registry, HTML → text, chunking, deterministic ids.
 * Shared by the `ingest-nps-pages` Edge Function (Deno) and Vitest (Vite
 * alias `@shared`). No I/O here.
 *
 * Sources are nps.gov pages only. `kind`:
 *   - evergreen: fees, passes, hiking, trail pages (re-fetched with every run)
 *   - live:      conditions, closures, construction, closure news releases
 *                (re-fetched daily; chunks older than 7 days are dropped)
 *   - safety:    the park's safety pages (raw page chunks) and the safety
 *                cards built from them (see safety-cards.ts)
 */

export type NpsKind = "evergreen" | "live" | "safety";

export interface NpsPage {
  url: string;
  /** Lowercase 4-letter NPS code, or "nps" for service-wide pages. */
  park_code: string;
  kind: NpsKind;
  /** Short label for citations when the page title can't be read. */
  label: string;
}

/** Parks in scope for NPS-page ingestion (Southern California first trips + Grand Canyon). */
export const NPS_PARKS: Record<string, string> = {
  jotr: "Joshua Tree National Park",
  deva: "Death Valley National Park",
  chis: "Channel Islands National Park",
  pinn: "Pinnacles National Park",
  seki: "Sequoia & Kings Canyon National Parks",
  yose: "Yosemite National Park",
  grca: "Grand Canyon National Park",
};

/** Official safety page per park (linked when no safety card matches). */
export const NPS_SAFETY_PAGE: Record<string, string> = {
  jotr: "https://www.nps.gov/jotr/planyourvisit/safety-guidelines-for-your-visit-to-joshua-tree-national-park.htm",
  deva: "https://www.nps.gov/deva/planyourvisit/safety.htm",
  chis: "https://www.nps.gov/chis/planyourvisit/safety.htm",
  pinn: "https://www.nps.gov/pinn/planyourvisit/safety.htm",
  seki: "https://www.nps.gov/seki/planyourvisit/safety.htm",
  yose: "https://www.nps.gov/yose/planyourvisit/safety.htm",
  grca: "https://www.nps.gov/grca/planyourvisit/safety.htm",
};

const P = "https://www.nps.gov";

function park(code: string, pages: Array<[string, NpsKind, string]>): NpsPage[] {
  return pages.map(([path, kind, label]) => ({ url: `${P}/${code}/${path}`, park_code: code, kind, label }));
}

export const NPS_PAGES: NpsPage[] = [
  // Service-wide
  { url: `${P}/aboutus/nonresident-fees.htm`, park_code: "nps", kind: "evergreen", label: "NPS — Nonresident fees" },
  { url: `${P}/planyourvisit/passes.htm`, park_code: "nps", kind: "evergreen", label: "NPS — Passes" },
  { url: `${P}/articles/10essentials.htm`, park_code: "nps", kind: "evergreen", label: "NPS — Ten Essentials" },
  ...park("jotr", [
    ["planyourvisit/fees.htm", "evergreen", "Joshua Tree — Fees & Passes"],
    ["planyourvisit/hiking.htm", "evergreen", "Joshua Tree — Hiking"],
    ["planyourvisit/conditions.htm", "live", "Joshua Tree — Current Conditions"],
    ["planyourvisit/safety-guidelines-for-your-visit-to-joshua-tree-national-park.htm", "safety", "Joshua Tree — Safety"],
  ]),
  ...park("deva", [
    ["planyourvisit/fees.htm", "evergreen", "Death Valley — Fees & Passes"],
    ["planyourvisit/hiking.htm", "evergreen", "Death Valley — Hiking"],
    ["planyourvisit/conditions.htm", "live", "Death Valley — Current Conditions"],
    ["planyourvisit/safety.htm", "safety", "Death Valley — Safety"],
  ]),
  ...park("chis", [
    ["planyourvisit/fees.htm", "evergreen", "Channel Islands — Fees & Passes"],
    ["planyourvisit/hiking.htm", "evergreen", "Channel Islands — Hiking"],
    ["planyourvisit/conditions.htm", "live", "Channel Islands — Current Conditions"],
    ["learn/news/2026-09-22-santa-rosa-overnight-use-reopens.htm", "live", "Channel Islands — Santa Rosa reopening (news release)"],
    ["planyourvisit/safety.htm", "safety", "Channel Islands — Safety"],
  ]),
  ...park("pinn", [
    ["planyourvisit/fees.htm", "evergreen", "Pinnacles — Fees & Passes"],
    ["planyourvisit/conditions.htm", "live", "Pinnacles — Current Conditions"],
    ["planyourvisit/safety.htm", "safety", "Pinnacles — Safety"],
  ]),
  ...park("seki", [
    ["planyourvisit/fees.htm", "evergreen", "Sequoia & Kings Canyon — Fees & Passes"],
    ["planyourvisit/conditions.htm", "live", "Sequoia & Kings Canyon — Current Conditions"],
    ["planyourvisit/road-construction.htm", "live", "Sequoia & Kings Canyon — Road Construction"],
    ["planyourvisit/safety.htm", "safety", "Sequoia & Kings Canyon — Safety"],
  ]),
  ...park("yose", [
    ["planyourvisit/fees.htm", "evergreen", "Yosemite — Fees & Passes"],
    ["planyourvisit/hiking.htm", "evergreen", "Yosemite — Hiking"],
    ["planyourvisit/halfdome.htm", "evergreen", "Yosemite — Half Dome"],
    ["planyourvisit/camping.htm", "evergreen", "Yosemite — Camping"],
    ["planyourvisit/conditions.htm", "live", "Yosemite — Current Conditions"],
    ["planyourvisit/safety.htm", "safety", "Yosemite — Safety"],
    ["planyourvisit/bears.htm", "safety", "Yosemite — Bears"],
  ]),
  ...park("grca", [
    ["planyourvisit/fees.htm", "evergreen", "Grand Canyon — Fees & Passes"],
    ["planyourvisit/conditions.htm", "live", "Grand Canyon — Current Conditions"],
    ["planyourvisit/lodging.htm", "live", "Grand Canyon — Lodging"],
    ["learn/news/grand-canyon-national-park-announces-projected-dates-for-restoring-water-to-south-rim.htm", "live", "Grand Canyon — Water restoration (news release)"],
    ["planyourvisit/safety.htm", "safety", "Grand Canyon — Safety"],
    ["planyourvisit/hike-smart.htm", "safety", "Grand Canyon — Hike Smart"],
  ]),
];

/** Live chunks older than this are deleted by the daily job. */
export const LIVE_MAX_AGE_DAYS = 7;

// ─── HTML → text ─────────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", deg: "°", frac12: "½",
  frac14: "¼", frac34: "¾", eacute: "é", aacute: "á", iacute: "í", oacute: "ó", uacute: "ú",
  ntilde: "ñ", Eacute: "É", copy: "©", reg: "®", trade: "™", bull: "•", middot: "·", times: "×",
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z0-9]+);/gi, (m, name) => ENTITIES[name] ?? m);
}

export interface ExtractedPage {
  title: string;
  /** "Last updated: …" as printed by NPS, if present. */
  last_updated: string | null;
  /** Main-column text, markdown-ish (## headings, - bullets). */
  text: string;
}

/** Extracts the main column of an nps.gov page as plain text. */
export function extractNpsPage(html: string): ExtractedPage {
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = clean(decodeEntities(stripTags(titleMatch?.[1] ?? ""))).replace(/\s*\(U\.S\..*$/, "");
  const updated = html.match(/Last updated:\s*([A-Z][a-z]+ \d{1,2}, \d{4})/);

  let start = html.search(/<h1[^>]*class="[^"]*page-title/i);
  if (start < 0) start = html.search(/<div[^>]+id="main"/i);
  if (start < 0) start = 0;
  let end = html.search(/Last updated:/i);
  if (end < start) end = html.search(/<footer/i);
  if (end < start) end = html.length;
  let body = html.slice(start, end);

  body = body
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|form|select|iframe|template)\b[\s\S]*?<\/\1>/gi, " ")
    // Fee accordions keep the price inside the header button: "Motorcycle — $25.00".
    .replace(/<div[^>]*class="[^"]*__Cost[^"]*"[^>]*>/gi, " — ")
    .replace(/<(nav)\b[\s\S]*?<\/nav>/gi, " ")
    .replace(/<img[^>]*>/gi, " ");
  // Structure → markdown-ish text.
  body = body
    .replace(/<h[1-2][^>]*>/gi, "\n\n## ")
    .replace(/<h[3-6][^>]*>/gi, "\n\n### ")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/(p|div|ul|ol|table|section|article|blockquote|figure|figcaption|header)>/gi, "\n")
    .replace(/<(p|div|ul|ol|table|section|article|blockquote|figure|header)\b[^>]*>/gi, "\n")
    .replace(/<tr[^>]*>/gi, "\n")
    .replace(/<\/t[dh]>/gi, " | ")
    .replace(/<br\s*\/?>/gi, "\n");
  body = decodeEntities(stripTags(body));

  const lines = body
    .split("\n")
    .map((l) => clean(l).replace(/\s*\|\s*$/, ""))
    .filter((l) => l && !/^(-|##|###|\|)$/.test(l))
    .filter((l) => !/^(Loading results|Search this site|Open \d+ Alerts?|Alerts In Effect|Dismiss|View all alerts|Was this page helpful\??)/i.test(l));
  const text = lines
    .join("\n")
    .replace(/\n(##+ )/g, "\n\n$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { title: title || "NPS", last_updated: updated?.[1] ?? null, text };
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ");
}

function clean(s: string): string {
  return s.replace(/[\t\u00a0 ]+/g, " ").trim();
}

// ─── Chunking ────────────────────────────────────────────────────────────────

export const NPS_MAX_CHUNK_CHARS = 1500;
export const NPS_OVERLAP_CHARS = 250;

/**
 * Splits page text into chunks on heading/paragraph boundaries. Each chunk
 * stays ≤ NPS_MAX_CHUNK_CHARS; a long paragraph is hard-split with overlap.
 */
export function chunkPageText(text: string, max = NPS_MAX_CHUNK_CHARS, overlap = NPS_OVERLAP_CHARS): string[] {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  let heading = "";
  const push = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };
  for (const block of blocks) {
    if (/^##+ /.test(block) && block.length < 200 && !block.includes("\n")) {
      // A new section starts: close the chunk if it is already substantial.
      if (current.length > max * 0.5) push();
      heading = block;
      current += (current ? "\n\n" : "") + block;
      continue;
    }
    if (block.length > max) {
      push();
      for (let i = 0; i < block.length; i += max - overlap) {
        const piece = block.slice(i, i + max);
        chunks.push((heading && i > 0 ? `${heading} (cont.)\n\n` : "") + piece);
        if (i + max >= block.length) break;
      }
      continue;
    }
    if (current.length + block.length + 2 > max) {
      push();
      if (heading && !block.startsWith(heading)) current = `${heading} (cont.)`;
    }
    current += (current ? "\n\n" : "") + block;
  }
  push();
  return chunks;
}

/** Text that is embedded and shown to the model for one page chunk. */
export function pageChunkContent(page: NpsPage, title: string, chunk: string): string {
  const parkName = NPS_PARKS[page.park_code] ?? "National Park Service";
  return `Página oficial NPS: ${title} — ${parkName}\n${page.url}\n\n${chunk}`;
}

// ─── Ids ─────────────────────────────────────────────────────────────────────

/** Formats 16 bytes as a uuid string (version nibble set to 5, RFC 4122 variant). */
export function bytesToUuid(bytes: Uint8Array): string {
  const b = Array.from(bytes.slice(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = b.map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/** Deterministic uuid for a source key (page URL, or URL + card topic). */
export async function sourceUuid(key: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(`nomaderia-nps:${key}`));
  return bytesToUuid(new Uint8Array(digest));
}

/** "2026-10-06T02:55Z" → "5 oct 2026": calendar day in America/Tijuana (the users' zone). */
export function shortDateEs(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Tijuana", year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const M = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${get("day")} ${M[get("month") - 1]} ${get("year")}`;
}
