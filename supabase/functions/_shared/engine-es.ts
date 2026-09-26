/**
 * Spanish presentation + catalog scoping for the vendored ranking engine.
 *
 * Shared by both runtimes: Deno Edge Functions import it by relative path,
 * Vite/Vitest via the `@shared` alias. It lives OUTSIDE `_shared/engine/` on
 * purpose — that folder is vendored byte-for-byte and hash-checked by
 * `npm run verify:engine` (ADR-026), so nothing hand-written goes in there.
 *
 * Nothing here scores or reorders parks; it only scopes the catalog and
 * translates engine output for people.
 */

import type { EngineData, RankedPark, TripProfile } from "./engine/engine.ts";
import { ENGINE_DATA } from "./engine/engine-data.generated.ts";

/**
 * Engine data restricted to the given park codes. `vocab.tag_idf` is left as
 * exported (computed upstream over the full catalog) so per-park scores stay
 * identical to the upstream fixtures regardless of how many parks are in scope.
 */
export function engineDataForParkCodes(codes: Iterable<string>, data: EngineData = ENGINE_DATA): EngineData {
  const wanted = new Set(Array.from(codes, (c) => c.toLowerCase()));
  return { ...data, catalog: data.catalog.filter((p) => wanted.has(p.park_code)) };
}

// ─── Spanish labels (display only; never affects order) ──────────────────────

export const BIOME_LABELS_ES: Record<string, string> = {
  alpine: "alta montaña",
  canyon: "cañones",
  cave: "cuevas",
  chaparral: "chaparral",
  coast: "costa",
  desert: "desierto",
  forest: "bosque",
  island: "isla",
  prairie: "pradera",
  rainforest: "bosque lluvioso",
  tundra: "tundra",
  urban: "urbano",
  volcano: "volcán",
  wetland: "humedales",
};

export const TAG_LABELS_ES: Record<string, string> = {
  "4x4": "rutas 4x4",
  archaeology: "arqueología",
  backpacking: "mochileo",
  beach: "playa",
  bears: "osos",
  biking: "ciclismo",
  birding: "aves",
  boardwalk: "pasarelas",
  boat: "paseos en bote",
  camping: "camping",
  climbing: "escalada",
  easy_walk: "caminatas fáciles",
  family: "para familias",
  fishing: "pesca",
  geothermal: "geotermia",
  giant_trees: "árboles gigantes",
  glacier: "glaciares",
  hiking: "senderismo",
  history: "historia",
  hot_springs: "aguas termales",
  kayak: "kayak",
  paleontology: "fósiles",
  photography: "fotografía",
  sand: "dunas",
  scenic_drive: "ruta escénica",
  snorkeling: "snorkel",
  stargazing: "cielo estrellado",
  sunrise: "amanecer",
  water: "agua",
  waterfalls: "cascadas",
  wilderness: "naturaleza salvaje",
  wildflowers: "flores silvestres",
  wildlife: "fauna",
  winter: "invierno",
};

/** Month penalty at or above this (≈2+ months off-season) earns an honest chip. */
export const OFF_SEASON_PENALTY_THRESHOLD = 0.1;

/** Short Spanish reason chips derived from engine `facts`/`breakdown`. */
export function buildSpanishReasons(park: RankedPark, profile: TripProfile, relaxedDrive: boolean): string[] {
  const bits: string[] = [];
  for (const b of park.facts.biomes) bits.push(BIOME_LABELS_ES[b] ?? b);

  const parkTags = new Set(park.facts.tags);
  let added = 0;
  for (const tag of profile.tags) {
    if (parkTags.has(tag) && added < 3) {
      bits.push(TAG_LABELS_ES[tag] ?? tag);
      added += 1;
    }
  }

  if ((profile.days_needed ?? "2-3") === park.facts.days_needed) {
    bits.push(`viaje de ${park.facts.days_needed} días`);
  }
  if (park.facts.crowd === "low") bits.push("pocas multitudes");
  if (park.facts.drive_hours != null) bits.push(`~${park.facts.drive_hours.toFixed(1)} h en auto (estimado)`);
  if (relaxedDrive) bits.push("fuera de tu radio de manejo");
  if (park.breakdown.month_penalty >= OFF_SEASON_PENALTY_THRESHOLD) bits.push("fuera de su mejor temporada");
  if (park.tied_with_neighbors) bits.push("empate técnico");
  return bits;
}
