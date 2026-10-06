// supabase/functions/_shared/retrieval-rules.ts
// Retrieval diversity + rule chunks (ADR-037).
//
// - diversifyChunks: at most `perSource` chunks per source (nps.gov URL, or the
//   Nomaderia guide/page they come from) in the top N, refilled from the
//   remaining candidates. Applied after merging the match_knowledge_chunks
//   results in function code; the SQL function is unchanged.
// - Rule intents: closures, overnight stays / sleeping in the car, permits, fire restrictions.
//   When the question matches, the agent runs the same match_knowledge_chunks
//   (same count and threshold) with a fixed English intent query, filtered to
//   the park, and pins the best chunk whose text really states that rule.

export interface DiverseChunk {
  id: string;
  similarity: number;
  source_table: string;
  metadata: { source_url?: string; slug?: string; park_code?: string };
}

/** One key per source page: the nps.gov URL, else the guide (table + slug/park). */
export function sourceKey(c: DiverseChunk): string {
  if (c.metadata.source_url) return c.metadata.source_url;
  const table = c.source_table === "destinations" ? "destinos" : c.source_table;
  return `${table}:${c.metadata.slug ?? c.metadata.park_code ?? c.id}`;
}

/**
 * Top `limit` by similarity with at most `perSource` per source. `pinned` chunks
 * go in first (same cap); the result is ordered pinned-first, then by similarity.
 */
export function diversifyChunks<T extends DiverseChunk>(
  candidates: T[],
  limit: number,
  perSource = 2,
  pinned: T[] = [],
): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  const perKey = new Map<string, number>();
  const take = (c: T) => {
    if (out.length >= limit || seen.has(c.id)) return;
    const key = sourceKey(c);
    const n = perKey.get(key) ?? 0;
    if (n >= perSource) return;
    perKey.set(key, n + 1);
    seen.add(c.id);
    out.push(c);
  };
  for (const c of pinned) take(c);
  for (const c of [...candidates].sort((a, b) => b.similarity - a.similarity)) take(c);
  return out;
}

export type RuleIntentId = "closures" | "overnight" | "permits" | "fires";

export interface RuleIntent {
  id: RuleIntentId;
  /** Spanish question cue. */
  question: RegExp;
  /** English query embedded to find the rule on the park's nps.gov pages. */
  queryEn: string;
  /** The chunk must actually state the rule. */
  content: RegExp;
}

export const RULE_INTENTS: RuleIntent[] = [
  {
    id: "overnight",
    question: /\bdorm\w*|\bduerm\w*|\bdurm\w*|pasar la noche|pernoct\w*|\bacamp\w*|\bcamping\b|campamento|(carro|coche|auto|camioneta|van|veh[ií]culo)\b[^.?!]{0,40}\bnoche|estacion\w*[^.?!]{0,30}\bnoche/i,
    queryEn: "Is sleeping in your car allowed? Overnight stays and sleeping in vehicles are only permitted in designated campsites; no overnight parking.",
    content: /sleep\w* in (a |your )?(car|vehicle)|overnight (parking|stays?)|sleeping in vehicles|car camping/i,
  },
  {
    id: "closures",
    question: /cerrad[oa]s?|\bcierr[ae]n?\b|\bcierre\b|abiert[oa]s?|\bclosed\b|closure|temporada|est[aá] (abierto|cerrado|disponible)/i,
    queryEn: "Current road and trail closures: which roads, trails and areas of the park are closed or open now.",
    content: /\bclos(ed|ure|ures|ing)\b|\breopen\w*/i,
  },
  {
    id: "fires",
    question: /fogat\w*|\bfuego\b|\bleña\b|carb[oó]n|\basador|\bparrilla|\bcampfire|\bbbq\b/i,
    queryEn: "Fire restrictions: are wood and charcoal campfires allowed in campgrounds and picnic areas right now?",
    content: /fire restriction|campfires?|wood and charcoal|charcoal/i,
  },
  {
    id: "permits",
    question: /permis\w*|\bpermit\w*|loter[ií]a|lottery|reservaci[oó]n de entrada|backcountry|wilderness/i,
    queryEn: "Is a permit required? Day-hike and wilderness permits, permit lottery dates and how to apply.",
    content: /\bpermits?\b|lottery/i,
  },
];

export function detectRuleIntents(question: string): RuleIntent[] {
  return RULE_INTENTS.filter((r) => r.question.test(question));
}

/** Best chunk per intent whose text states the rule (official NPS pages only). */
export function pickRuleChunks<T extends DiverseChunk & { content: string }>(
  intent: RuleIntent,
  results: T[],
  minSimilarity: number,
  max = 1,
): T[] {
  return results
    .filter((c) => c.source_table === "nps_pages" && c.similarity >= minSimilarity && intent.content.test(c.content))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, max);
}
