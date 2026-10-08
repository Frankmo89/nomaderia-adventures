// supabase/functions/ingest-nps-pages/index.ts
// Nomaderia Adventures — official NPS pages → knowledge_chunks (ADR-036)
//
// Fetches the nps.gov pages in _shared/nps-pages.ts, chunks the main column,
// embeds with the same model as ingest-knowledge (text-embedding-3-small) and
// upserts rows with source_url / fetched_at / park_code / kind. Then builds
// the per-park safety cards (_shared/safety-cards.ts): NPS text verbatim plus
// a faithful Spanish rendering whose numbers must match the original.
// Also refreshes the fee tables (ADR-037): park_fees from each park's
// fees.htm (cross-checked with the passes.htm nonresident list) and
// pass_rules from passes.htm + the nonresident-fees FAQ. A row that fails
// to parse keeps its last good values (only parse_ok rows overwrite).
//
// Leave-last-known-good: a page that fails to fetch keeps its old rows. Live
// rows older than 7 days are deleted (here and by the daily pg_cron job).
//
// POST /functions/v1/ingest-nps-pages   (service_role JWT only)
// Body: { park_codes?: string[] ("nps" = service-wide pages), kinds?: ("evergreen"|"live"|"safety")[],
//         cards?: boolean (default true), prune?: boolean (default true) }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import {
  chunkPageText,
  extractNpsPage,
  LIVE_MAX_AGE_DAYS,
  NPS_PAGES,
  NPS_PARKS,
  pageChunkContent,
  sourceUuid,
  type NpsKind,
  type NpsPage,
} from "../_shared/nps-pages.ts";
import { buildCardCandidates, cardContent, SAFETY_TOPIC_ES, type CardCandidate } from "../_shared/safety-cards.ts";
import { ungroundedNumbers } from "../_shared/concierge-guard.ts";
import {
  FEE_PARKS,
  feesUrl,
  NONRESIDENT_FAQ_URL,
  parseNonresidentList,
  parseParkFeesPage,
  parsePassRules,
  PASSES_URL,
  withNonresidentList,
} from "../_shared/park-fees.ts";

const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SUPA_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EMBED_MODEL = "text-embedding-3-small";
const CHAT_MODEL = "gpt-4o-mini";
const PAGE_TABLE = "nps_pages";
const CARD_TABLE = "nps_safety_cards";
const USER_AGENT = "Mozilla/5.0 (compatible; NomaderiaBot/1.0; +https://nomaderia.com)";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  park_codes?: string[];
  kinds?: NpsKind[];
  cards?: boolean;
  prune?: boolean;
}

interface ExistingRow {
  source_field: string;
  content: string;
  metadata: Record<string, unknown> | null;
}

interface PageResult {
  url: string;
  ok: boolean;
  chunks?: number;
  embedded?: number;
  error?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

/** The gateway verifies the JWT signature (verify_jwt); here we only accept the service role. */
function isServiceRole(req: Request): boolean {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (token && token === SUPA_SERVICE) return true;
  const part = token.split(".")[1];
  if (!part) return false;
  try {
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as { role?: string };
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

async function embed(inputs: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < inputs.length; i += 64) {
    const batch = inputs.slice(i, i + 64);
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBED_MODEL, input: batch }),
    });
    if (!res.ok) throw new Error(`OpenAI embedding error ${res.status}: ${await res.text()}`);
    const data = await res.json() as { data: Array<{ embedding: number[]; index: number }> };
    for (const d of data.data.sort((a, b) => a.index - b.index)) out.push(d.embedding);
  }
  return out;
}

/** Faithful Spanish rendering of an NPS safety paragraph. Null if the numbers drift. */
async function translateCard(verbatim: string): Promise<string | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content:
            "Traduce al español de México, fiel y completo, el texto oficial del Servicio de Parques Nacionales. " +
            "No agregues, quites ni suavices nada. Conserva cada cifra y unidad exactamente como está (no conviertas unidades). " +
            "Devuelve solo la traducción.",
        },
        { role: "user", content: verbatim },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const es = (data.choices?.[0]?.message?.content ?? "").trim();
  if (!es) return null;
  // Every digit in the Spanish text must exist in the NPS original.
  if (ungroundedNumbers(es, verbatim).length > 0) return null;
  return es;
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "text/html" }, redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  const run = async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      await worker(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!isServiceRole(req)) return json({ error: "Solo service_role" }, 401);

  let body: RequestBody = {};
  try {
    body = await req.json() as RequestBody;
  } catch {
    body = {};
  }
  const parks = body.park_codes?.length ? new Set(body.park_codes.map((c) => c.toLowerCase())) : null;
  const kinds = body.kinds?.length ? new Set(body.kinds) : null;
  const pages = NPS_PAGES.filter((p) => (!parks || parks.has(p.park_code)) && (!kinds || kinds.has(p.kind)));
  const wantCards = body.cards !== false;
  const supabase = createClient(SUPA_URL, SUPA_SERVICE);

  const results: PageResult[] = [];
  const extractedByPark = new Map<string, Array<{ page: NpsPage; title: string; text: string; fetched_at: string }>>();

  await pool(pages, 3, async (page) => {
    const fetchedAt = new Date().toISOString();
    try {
      const html = await fetchPage(page.url);
      const ex = extractNpsPage(html);
      if (ex.text.length < 200) throw new Error("página sin contenido legible");
      const list = extractedByPark.get(page.park_code) ?? [];
      list.push({ page, title: ex.title, text: ex.text, fetched_at: fetchedAt });
      extractedByPark.set(page.park_code, list);

      const sourceId = await sourceUuid(page.url);
      const pieces = chunkPageText(ex.text);
      const { data: existing } = await supabase
        .from("knowledge_chunks")
        .select("source_field, content, metadata")
        .eq("source_table", PAGE_TABLE)
        .eq("source_id", sourceId)
        .returns<ExistingRow[]>();
      const oldByField = new Map((existing ?? []).map((r) => [r.source_field, r]));

      const rows = pieces.map((piece, i) => {
        const source_field = `page (parte ${i + 1}/${pieces.length})`;
        const content = pageChunkContent(page, ex.title, piece);
        return {
          source_field,
          content,
          metadata: {
            title: `NPS — ${ex.title} (${NPS_PARKS[page.park_code] ?? "National Park Service"})`,
            section: page.kind === "live" ? "condiciones (NPS)" : page.kind === "safety" ? "seguridad (NPS)" : "página oficial (NPS)",
            park_code: page.park_code,
            source_url: page.url,
            fetched_at: fetchedAt,
            kind: page.kind,
            page_last_updated: ex.last_updated,
          },
        };
      });
      const changed = rows.filter((r) => oldByField.get(r.source_field)?.content !== r.content);
      const unchanged = rows.filter((r) => oldByField.get(r.source_field)?.content === r.content);
      const vectors = changed.length ? await embed(changed.map((r) => r.content)) : [];
      const base = { source_table: PAGE_TABLE, source_id: sourceId, source_url: page.url, fetched_at: fetchedAt, park_code: page.park_code, kind: page.kind };
      if (changed.length) {
        const { error } = await supabase.from("knowledge_chunks").upsert(
          changed.map((r, i) => ({ ...base, ...r, embedding: vectors[i] })),
          { onConflict: "source_table,source_id,source_field" },
        );
        if (error) throw new Error(`upsert: ${error.message}`);
      }
      if (unchanged.length) {
        const { error } = await supabase.from("knowledge_chunks").upsert(
          unchanged.map((r) => ({ ...base, ...r })),
          { onConflict: "source_table,source_id,source_field" },
        );
        if (error) throw new Error(`refresh: ${error.message}`);
      }
      // Parts that no longer exist on the page (it got shorter).
      await supabase
        .from("knowledge_chunks")
        .delete()
        .eq("source_table", PAGE_TABLE)
        .eq("source_id", sourceId)
        .lt("fetched_at", fetchedAt);
      results.push({ url: page.url, ok: true, chunks: rows.length, embedded: changed.length });
    } catch (err) {
      console.warn(`ingest-nps-pages: ${page.url} failed: ${err instanceof Error ? err.message : String(err)}`);
      results.push({ url: page.url, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // ── Safety cards, per park, from every page fetched in this run ──────────
  const cardResults: Array<{ park_code: string; topic: string; url: string; translated: boolean }> = [];
  if (wantCards) {
    for (const [parkCode, list] of extractedByPark) {
      if (parkCode === "nps") continue;
      const fetchedByUrl = new Map(list.map((x) => [x.page.url, x.fetched_at]));
      // Cards compare topics across all of a park's pages: only rebuild on a full, successful park run.
      const fullPark = NPS_PAGES.filter((p) => p.park_code === parkCode).every((p) => fetchedByUrl.has(p.url));
      if (!fullPark) continue;
      const candidates: CardCandidate[] = buildCardCandidates(
        list.map((x) => ({ url: x.page.url, title: x.title, text: x.text, kind: x.page.kind })),
      );
      const { data: oldCards } = await supabase
        .from("knowledge_chunks")
        .select("source_field, content, metadata")
        .eq("source_table", CARD_TABLE)
        .eq("park_code", parkCode)
        .returns<ExistingRow[]>();
      const oldByField = new Map((oldCards ?? []).map((r) => [r.source_field, r]));
      const parkName = NPS_PARKS[parkCode] ?? parkCode;
      const cardRows: Array<Record<string, unknown>> = [];
      await pool(candidates, 4, async (c) => {
        const source_field = `card:${c.topic}`;
        const old = oldByField.get(source_field);
        const oldMeta = (old?.metadata ?? {}) as { verbatim?: string; es?: string | null };
        const es = oldMeta.verbatim === c.verbatim && oldMeta.es ? oldMeta.es : await translateCard(c.verbatim);
        const fetchedAt = fetchedByUrl.get(c.url) ?? new Date().toISOString();
        cardRows.push({
          source_table: CARD_TABLE,
          source_id: await sourceUuid(`${parkCode}#card`),
          source_field,
          content: cardContent(parkName, c.topic, es, c.verbatim, c.url),
          source_url: c.url,
          fetched_at: fetchedAt,
          park_code: parkCode,
          kind: "safety",
          metadata: {
            title: `NPS — Seguridad: ${SAFETY_TOPIC_ES[c.topic]} (${parkName})`,
            section: "tarjeta de seguridad (NPS)",
            park_code: parkCode,
            source_url: c.url,
            fetched_at: fetchedAt,
            kind: "safety",
            topic: c.topic,
            verbatim: c.verbatim,
            es,
            page_title: c.title,
          },
        });
        cardResults.push({ park_code: parkCode, topic: c.topic, url: c.url, translated: Boolean(es) });
      });
      if (!cardRows.length) continue;
      const vectors = await embed(cardRows.map((r) => String(r.content)));
      const { error } = await supabase.from("knowledge_chunks").upsert(
        cardRows.map((r, i) => ({ ...r, embedding: vectors[i] })),
        { onConflict: "source_table,source_id,source_field" },
      );
      if (error) console.warn(`ingest-nps-pages: cards ${parkCode}: ${error.message}`);
      // A full run of the park re-derives every topic: drop cards for topics no longer found.
      if (!error) {
        const keep = cardRows.map((r) => String(r.source_field));
        const stale = [...oldByField.keys()].filter((f) => !keep.includes(f));
        if (stale.length) {
          await supabase.from("knowledge_chunks").delete().eq("source_table", CARD_TABLE).eq("park_code", parkCode).in("source_field", stale);
        }
      }
    }
  }

  // ── Fee tables (ADR-037) ───────────────────────────────────────────────────
  const feeResults: Array<{ park_code: string; ok: boolean; issues: string[] }> = [];
  const passResults: Array<{ pass_code: string; ok: boolean }> = [];
  try {
    const textByUrl = new Map<string, { text: string; fetched_at: string }>();
    for (const list of extractedByPark.values()) for (const x of list) textByUrl.set(x.page.url, { text: x.text, fetched_at: x.fetched_at });
    const feeParks = Object.keys(FEE_PARKS).filter((c) => textByUrl.has(feesUrl(c)));
    const wantRules = textByUrl.has(PASSES_URL) || textByUrl.has(NONRESIDENT_FAQ_URL);
    const ensure = async (url: string) => {
      if (textByUrl.has(url)) return textByUrl.get(url)!;
      const fetchedAt = new Date().toISOString();
      const ex = extractNpsPage(await fetchPage(url));
      const got = { text: ex.text, fetched_at: fetchedAt };
      textByUrl.set(url, got);
      return got;
    };
    if (feeParks.length || wantRules) {
      // The nonresident list lives on passes.htm: always check each park against it.
      const passes = await ensure(PASSES_URL);
      const list = parseNonresidentList(passes.text);
      for (const code of feeParks) {
        const page = textByUrl.get(feesUrl(code))!;
        let row = parseParkFeesPage(code, page.text, page.fetched_at);
        if (list.names.length) row = withNonresidentList(row, list.names);
        else row = { ...row, parse_ok: false, issues: [...row.issues, "lista oficial de no residentes no encontrada en passes.htm"] };
        feeResults.push({ park_code: code, ok: row.parse_ok, issues: row.issues });
        if (!row.parse_ok) {
          // Keep last good values; only flag the problem.
          await supabase.from("park_fees").update({ issues: row.issues, updated_at: new Date().toISOString() }).eq("park_code", code);
          console.warn(`ingest-nps-pages: park_fees ${code} not verified: ${row.issues.join("; ")}`);
          continue;
        }
        const { error } = await supabase.from("park_fees").upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "park_code" });
        if (error) console.warn(`ingest-nps-pages: park_fees ${code}: ${error.message}`);
      }
      if (wantRules) {
        const faq = await ensure(NONRESIDENT_FAQ_URL);
        const rules = parsePassRules(passes.text, faq.text, faq.fetched_at);
        for (const r of rules) {
          passResults.push({ pass_code: r.pass_code, ok: r.parse_ok });
          if (!r.parse_ok) {
            console.warn(`ingest-nps-pages: pass_rules ${r.pass_code} not verified; keeping last good row`);
            continue;
          }
          const { error } = await supabase.from("pass_rules").upsert({ ...r, updated_at: new Date().toISOString() }, { onConflict: "pass_code" });
          if (error) console.warn(`ingest-nps-pages: pass_rules ${r.pass_code}: ${error.message}`);
        }
      }
    }
  } catch (err) {
    console.warn(`ingest-nps-pages: fee tables failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── Drop live chunks older than LIVE_MAX_AGE_DAYS ─────────────────────────
  let pruned = 0;
  if (body.prune !== false) {
    const cutoff = new Date(Date.now() - LIVE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("knowledge_chunks")
      .delete({ count: "exact" })
      .eq("kind", "live")
      .lt("fetched_at", cutoff);
    pruned = count ?? 0;
  }

  const failed = results.filter((r) => !r.ok);
  return json({
    pages: results.length,
    ok: results.length - failed.length,
    failed,
    chunks: results.reduce((n, r) => n + (r.chunks ?? 0), 0),
    embedded: results.reduce((n, r) => n + (r.embedded ?? 0), 0),
    cards: cardResults,
    park_fees: feeResults,
    pass_rules: passResults,
    pruned_live: pruned,
  }, failed.length && failed.length === results.length ? 502 : 200);
});
