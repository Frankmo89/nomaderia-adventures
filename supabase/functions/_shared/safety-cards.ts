/**
 * Safety cards from official NPS pages (ADR-036).
 *
 * The concierge never writes safety advice itself. When a question has a
 * safety intent it attaches the matching card(s) for the park: the NPS text
 * verbatim (English) plus a faithful Spanish rendering made at ingest time,
 * with source URL and fetch date. No card → "En una emergencia, llama al
 * 911" + the park's official safety page.
 *
 * Pure module (Deno Edge Functions + Vitest via `@shared`).
 */
import { NPS_SAFETY_PAGE, shortDateEs } from "./nps-pages.ts";

export const SAFETY_TOPICS = ["heat", "water", "drowning", "wildlife", "smoke", "altitude", "flood", "emergency"] as const;
export type SafetyTopic = (typeof SAFETY_TOPICS)[number];

export const SAFETY_TOPIC_ES: Record<SafetyTopic, string> = {
  heat: "calor",
  water: "agua",
  drowning: "ríos y ahogamiento",
  wildlife: "fauna",
  smoke: "humo y calidad del aire",
  altitude: "altura y mal de montaña",
  flood: "inundaciones repentinas y tormentas",
  emergency: "emergencias",
};

/** English matchers used at ingest to pick NPS paragraphs for each card. */
const CARD_MATCH: Record<SafetyTopic, RegExp[]> = {
  heat: [/\bheat\b|\bhot[- ]weather\b|\b1[01]\d\s?°F/i, /\bhot\b/i, /temperature/i, /heat (exhaustion|stroke|illness)/i, /\bsummer\b/i],
  water: [/drink(ing)? (plenty of |more |small amounts of )?water|dehydrat|gallons?\b|\b(liters?|litres?|quarts?)\b|(carry|bring|pack) (at least |plenty of |enough |extra )?(\w+ )?water/i, /\bwater\b/i, /\bcarry\b/i, /per (person|day)/i],
  drowning: [/drown|\bswift (water|current|river)|near (flowing|moving|swift) water|rapids|river safety|undertow|rip currents?|pools above/i, /\brivers?\b|\bswim/i, /\bcold\b/i, /slippery|slick/i, /\bcurrents?\b|rapids/i],
  wildlife: [/\bbears?\b|rattlesnake|mountain lions?|\bwildlife\b/i, /\byards\b|keep (your |a safe )?distance|give it space|back away/i, /food (storage|lockers?)|\bfeed(ing)?\b/i, /\bsnakes?\b/i],
  smoke: [/air quality|wildfire smoke|\bsmoky\b|smoke (from|can|may|is|levels)|(wood|fire) smoke/i, /\bsmoke\b/i, /wildfire/i],
  altitude: [/altitude/i, /elevation (sickness|illness)/i, /mountain sickness/i, /headache|nausea/i],
  flood: [/flash flood/i, /\bfloods?\b/i, /thunderstorm|lightning/i, /\brain\b/i],
  emergency: [/\b911\b/i, /emergenc/i, /cell (phone )?(service|coverage|reception)/i, /\bsearch and rescue\b/i],
};

/** Text NPS uses for the most actionable version of each topic. */
const CARD_PREFER: Record<SafetyTopic, RegExp> = {
  heat: /do not (hike|attempt)|when it is hot|heat (illness|exhaustion|stroke)|hot[- ]weather hiking|°F/i,
  water: /per person|a day|each day/i,
  drowning: /drown|prohibited/i,
  wildlife: /\byards\b|keep (your )?distance|scare it away/i,
  smoke: /air quality/i,
  altitude: /descend/i,
  flood: /flash flood/i,
  emergency: /\b911\b/i,
};

/** Paragraphs must hit the first (anchor) pattern of the topic. */
export function scoreParagraph(topic: SafetyTopic, paragraph: string): number {
  const pats = CARD_MATCH[topic];
  if (!pats[0].test(paragraph)) return 0;
  const hits = pats.filter((p) => p.test(paragraph)).length;
  return hits + 2 + (CARD_PREFER[topic].test(paragraph) ? 2 : 0);
}

export interface CardSourcePage {
  url: string;
  title: string;
  text: string;
  kind: string;
}

export interface CardCandidate {
  topic: SafetyTopic;
  url: string;
  title: string;
  /** NPS text, verbatim (one or two adjacent paragraphs, ≤ ~700 chars). */
  verbatim: string;
}

const CARD_MAX_CHARS = 700;

/** Lines of page text; a line ending in ":" absorbs the short list lines that follow it. */
function paragraphs(text: string): string[] {
  const lines = text.split(/\n+/).map((p) => p.replace(/^-\s+/, "").trim()).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (/^#/.test(line)) continue;
    if (line.endsWith(":")) {
      const items: string[] = [];
      while (
        i + 1 < lines.length && lines[i + 1].length < 160 && items.length < 6 &&
        !/^#/.test(lines[i + 1]) && !/\bphoto\b|^learn more|\|/i.test(lines[i + 1])
      ) {
        items.push(lines[++i].replace(/[.;]$/, ""));
      }
      if (items.length) line = `${line} ${items.join("; ")}.`;
    }
    if (line.length >= 60) out.push(line);
  }
  return out;
}

/** Picks the best NPS paragraph(s) per topic across a park's pages. Safety pages win ties. */
export function buildCardCandidates(pages: CardSourcePage[]): CardCandidate[] {
  const out: CardCandidate[] = [];
  for (const topic of SAFETY_TOPICS) {
    let best: { score: number; page: CardSourcePage; idx: number; paras: string[] } | null = null;
    for (const page of pages) {
      const paras = paragraphs(page.text);
      paras.forEach((p, idx) => {
        let score = scoreParagraph(topic, p);
        if (!score) return;
        if (page.kind === "safety") score += 1;
        if (p.length > 1200) score -= 2;
        if (!best || score > best.score) best = { score, page, idx, paras };
      });
    }
    if (!best) continue;
    const b = best as { score: number; page: CardSourcePage; idx: number; paras: string[] };
    let verbatim = truncateSentences(b.paras[b.idx], CARD_MAX_CHARS);
    const next = b.paras[b.idx + 1];
    if (next && verbatim.length < 350 && scoreParagraph(topic, next) > 0) {
      verbatim = truncateSentences(`${verbatim} ${next}`, CARD_MAX_CHARS);
    }
    out.push({ topic, url: b.page.url, title: b.page.title, verbatim });
  }
  return out;
}

function truncateSentences(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\u201d"), cut.lastIndexOf("! "));
  return end > max * 0.4 ? cut.slice(0, end + 1) : cut.trimEnd() + "…";
}

/** Text stored in knowledge_chunks.content for a card (embedded, shown to the exam as evidence). */
export function cardContent(parkName: string, topic: SafetyTopic, es: string | null, verbatim: string, url: string): string {
  const head = `Tarjeta de seguridad NPS — ${parkName}: ${SAFETY_TOPIC_ES[topic]}`;
  const esPart = es ? `${es}\n\n` : "";
  return `${head}\n${esPart}Texto oficial NPS (inglés): “${verbatim}”\n${url}`;
}

// ─── Intent detection (Spanish questions) ────────────────────────────────────

const INTENT: Record<SafetyTopic, RegExp> = {
  heat: /calor|temperatura|°\s?f\b|\d{2,3}\s?(°|grados)|grados|golpe de calor|insolaci|bochorno|sol (fuerte|intenso)/i,
  water: /\bagua\b|deshidrat|\blitros?\b|gal[oó]n|galones|hidrat|potable|manantial/i,
  drowning: /\br[ií]os?\b|ahog|nadar|\bnado\b|corriente|cascada|\bpoza|\bpool\b|lago|oleaje|\bolas\b|ba[nñ]arme|meterme al agua|meterme a/i,
  wildlife: /\bosos?\b|puma|le[oó]n de monta|serpiente|v[ií]bora|cascabel|fauna|animal|coyote|alacr[aá]n|escorpi[oó]n|abejas?\b/i,
  smoke: /humo|calidad del aire|aire (no saludable|insalubre|malo)/i,
  altitude: /\baltura\b|altitud|mal de (altura|monta)|soroche|duele (mucho )?la cabeza|n[aá]usea|mareo/i,
  flood: /inundaci|crecida|lluvia|tormenta|aguacero|monz[oó]n|rayos?\b|rel[aá]mpago/i,
  emergency: /emergenc|\b911\b|me perd[ií]|perdid[oa]s?\b|herid|lastim|torc[ií]|accidente|ambulanc|rescate|se[nñ]al|celular/i,
};

const HIKING = /caminat|sendero|hiking|\bhike|caminar|excursi|descenso|bajar al r[ií]o|salar/i;
/** Parks where NPS treats heat as the main hiking hazard. */
const HEAT_PARKS = new Set(["deva", "jotr", "grca", "pinn"]);
/** Hiking at these times implies heat anywhere. */
const HOT_TIME = /verano|mediod[ií]a|pleno sol|julio|agosto/i;

/** Safety topics in a Spanish question. `parkCodes` lets desert hiking imply heat. */
export function detectSafetyTopics(question: string, parkCodes: Iterable<string> = []): SafetyTopic[] {
  const found = SAFETY_TOPICS.filter((t) => INTENT[t].test(question));
  const parks = [...parkCodes];
  if (!found.includes("heat") && HIKING.test(question) && (parks.some((p) => HEAT_PARKS.has(p)) || HOT_TIME.test(question))) {
    found.unshift("heat");
  }
  return found;
}

// ─── Visible block ───────────────────────────────────────────────────────────

export interface SafetyCard {
  id: string;
  park_code: string;
  topic: SafetyTopic;
  es: string | null;
  verbatim: string;
  source_url: string;
  fetched_at: string | null;
  park_name: string;
}

export const EMERGENCY_LINE = "En una emergencia, llama al 911.";

/** Official safety page for a park; service-wide page when the park is unknown. */
export function safetyPageFor(parkCode: string | null): string {
  if (parkCode && NPS_SAFETY_PAGE[parkCode]) return NPS_SAFETY_PAGE[parkCode];
  if (parkCode && /^[a-z]{4}$/.test(parkCode)) return `https://www.nps.gov/${parkCode}/planyourvisit/index.htm`;
  return "https://www.nps.gov/subjects/healthandsafety/index.htm";
}

/** Verbatim-grounded block appended after the model's answer. */
export function formatSafetyCards(cards: SafetyCard[]): string {
  return cards
    .map((c) => {
      const date = shortDateEs(c.fetched_at);
      const head = `Aviso de seguridad del NPS (${c.park_name}, ${SAFETY_TOPIC_ES[c.topic]}):`;
      const es = c.es ? `${c.es}\n` : "";
      return `${head}\n${es}Texto oficial: “${c.verbatim}”\nPágina oficial: ${c.source_url}${date ? ` · consultada ${date}` : ""}`;
    })
    .join("\n\n");
}

/** No matching card: the fixed emergency line + the park's official safety page. */
export function safetyFallback(parkCode: string | null): string {
  return `${EMERGENCY_LINE} Guía oficial de seguridad del NPS: ${safetyPageFor(parkCode)}`;
}
