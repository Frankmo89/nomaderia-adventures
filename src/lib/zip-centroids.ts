/**
 * US ZIP → approximate lat/lon, from the Census ZCTA gazetteer table that lives
 * in the repo at public/data/zcta-centroids-<year>.txt (built by
 * scripts/build-zip-centroids.ts). No external API: it's served from our own
 * origin like any other static file.
 *
 * It is deliberately a static text file, not a JS module: ~530 KB (≈155 KB
 * compressed) of data as a string literal made `vite build` go from ~15 s to
 * 6+ minutes and would cost the browser a JS parse. As a file it skips the
 * bundler entirely, is fetched only when someone reaches the quiz's ZIP field,
 * and is cached by `public/_headers` (/data/*).
 *
 * ZCTA ≠ ZIP: PO-box-only and single-organization ZIPs (e.g. 90009) have no
 * ZCTA. For those we fall back to the numerically nearest ZCTA in the same
 * 3-digit prefix (same sectional center) — never a prefix average, because a
 * prefix can span islands (967xx is both Hawaii and American Samoa).
 */

/** Census gazetteer year the table was built from. Bump + rerun the script to refresh. */
export const ZCTA_GAZETTEER_YEAR = 2025;
/** Public URL path of the table (file: public/<path>). The year in the name busts caches on refresh. */
export const ZCTA_TABLE_PATH = `/data/zcta-centroids-${ZCTA_GAZETTEER_YEAR}.txt`;

export type ZipMatch = "exact" | "nearby";

export interface ZipCentroid {
  lat: number;
  lon: number;
  /** "nearby" = no ZCTA for this ZIP; coordinates of the closest one in its prefix. */
  match: ZipMatch;
}

export interface ZipTable {
  exact: Map<string, [number, number]>;
  /** 3-digit prefix → numeric ZCTAs in that prefix, ascending. */
  byPrefix: Map<string, number[]>;
}

const ZIP_RE = /^\d{5}$/;

export function isValidZipFormat(zip: string): boolean {
  return ZIP_RE.test(zip);
}

/**
 * ZIPs where "driving" can't mean the road-trip radius the engine models: the
 * engine's drive estimate is straight-line distance, so it would call Maui a
 * two-hour drive from Honolulu. Hawaii 967–968 (967 also holds American Samoa),
 * Guam/Northern Mariana 969, Puerto Rico 006/007/009, US Virgin Islands 008.
 */
const ISLAND_PREFIXES = new Set(["006", "007", "008", "009", "967", "968", "969"]);

export function isIslandZip(zip: string): boolean {
  return isValidZipFormat(zip) && ISLAND_PREFIXES.has(zip.slice(0, 3));
}

/** Parses the table: one "<zip> <lat>,<lon>" per line; "#" lines are comments. */
export function parseZipTable(raw: string): ZipTable {
  const exact = new Map<string, [number, number]>();
  const byPrefix = new Map<string, number[]>();
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const zip = line.slice(0, 5);
    const [lat, lon] = line.slice(6).split(",").map(Number);
    if (!isValidZipFormat(zip) || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    exact.set(zip, [lat, lon]);
    const prefix = zip.slice(0, 3);
    const list = byPrefix.get(prefix);
    if (list) list.push(Number(zip));
    else byPrefix.set(prefix, [Number(zip)]);
  }
  for (const list of byPrefix.values()) list.sort((a, b) => a - b);
  return { exact, byPrefix };
}

/** Synchronous lookup against an already-parsed table. `null` = not a US ZIP we can place. */
export function lookupZipIn(table: ZipTable, zip: string): ZipCentroid | null {
  if (!isValidZipFormat(zip)) return null;
  const hit = table.exact.get(zip);
  if (hit) return { lat: hit[0], lon: hit[1], match: "exact" };

  const candidates = table.byPrefix.get(zip.slice(0, 3));
  if (!candidates || candidates.length === 0) return null;
  const target = Number(zip);
  let best = candidates[0];
  for (const c of candidates) {
    if (Math.abs(c - target) < Math.abs(best - target)) best = c;
  }
  const near = table.exact.get(String(best).padStart(5, "0"));
  return near ? { lat: near[0], lon: near[1], match: "nearby" } : null;
}

let tablePromise: Promise<ZipTable> | null = null;

/** Fetches + parses the table once. Safe to call repeatedly; a failed fetch can be retried. */
export function loadZipTable(): Promise<ZipTable> {
  if (!tablePromise) {
    tablePromise = fetch(ZCTA_TABLE_PATH)
      .then((res) => {
        if (!res.ok) throw new Error(`GET ${ZCTA_TABLE_PATH} → ${res.status}`);
        return res.text();
      })
      .then(parseZipTable)
      .catch((err) => {
        tablePromise = null;
        throw err;
      });
  }
  return tablePromise;
}

/** Start downloading the table early (e.g. when the ZIP field gets focus). */
export function preloadZipTable(): void {
  void loadZipTable().catch(() => undefined);
}

/** Resolves a ZIP, fetching the table on first use. Rejects only if the table can't be loaded. */
export async function lookupZip(zip: string): Promise<ZipCentroid | null> {
  if (!isValidZipFormat(zip)) return null;
  return lookupZipIn(await loadZipTable(), zip);
}

/** Test hook: forget the cached table so a test can stub `fetch` again. */
export function resetZipTableCacheForTests(): void {
  tablePromise = null;
}
