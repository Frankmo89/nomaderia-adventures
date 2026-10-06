/**
 * Dry run of the NPS page ingest (ADR-036). No database writes, no secrets.
 *
 *   npm run nps:preview              # all parks
 *   npm run nps:preview -- yose deva # some parks ("nps" = service-wide pages)
 *
 * Fetches every page in supabase/functions/_shared/nps-pages.ts with the same
 * extractor and chunker the ingest-nps-pages edge function uses, and prints
 * chunk counts per page plus the safety-card paragraphs each park would get.
 * The real ingest runs in the edge function (daily pg_cron job
 * nps-pages-refresh-daily, or `select public.request_nps_pages_ingest();`).
 */
import { chunkPageText, extractNpsPage, NPS_PAGES } from "../supabase/functions/_shared/nps-pages.ts";
import { buildCardCandidates, type CardSourcePage } from "../supabase/functions/_shared/safety-cards.ts";

const UA = "Mozilla/5.0 (compatible; NomaderiaBot/1.0; +https://nomaderia.com)";

async function main(): Promise<void> {
  const wanted = new Set(process.argv.slice(2).map((a) => a.toLowerCase()));
  const pages = NPS_PAGES.filter((p) => !wanted.size || wanted.has(p.park_code));
  const byPark = new Map<string, CardSourcePage[]>();
  for (const page of pages) {
    try {
      const res = await fetch(page.url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ex = extractNpsPage(await res.text());
      const chunks = chunkPageText(ex.text);
      console.log(`${page.park_code}\t${page.kind}\t${chunks.length} chunks\t${ex.text.length} chars\t${page.url}`);
      const list = byPark.get(page.park_code) ?? [];
      list.push({ url: page.url, title: ex.title, text: ex.text, kind: page.kind });
      byPark.set(page.park_code, list);
    } catch (err) {
      console.log(`${page.park_code}\t${page.kind}\tFAILED ${err instanceof Error ? err.message : String(err)}\t${page.url}`);
    }
  }
  for (const [park, list] of byPark) {
    if (park === "nps") continue;
    console.log(`\n## ${park} safety cards`);
    for (const c of buildCardCandidates(list)) console.log(`- ${c.topic}: ${c.verbatim.slice(0, 160)}… (${c.url})`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
