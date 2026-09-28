/**
 * Tests read the real ZIP table straight from public/ (Node fs), so a bad
 * regeneration of the committed file fails the suite instead of a fixture
 * hiding it. The browser fetches the same file over HTTP.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ZCTA_TABLE_PATH, parseZipTable, type ZipTable } from "@/lib/zip-centroids";

export function readZipTableText(): string {
  return readFileSync(resolve(process.cwd(), `public${ZCTA_TABLE_PATH}`), "utf8");
}

let cached: ZipTable | null = null;

export function realZipTable(): ZipTable {
  cached ??= parseZipTable(readZipTableText());
  return cached;
}
