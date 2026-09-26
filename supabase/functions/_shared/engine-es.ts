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

import type { EngineData, RankedPark, RecommendResult, TripProfile } from "./engine/engine.ts";
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

// ─── Concierge tool output (contract §6) ─────────────────────────────────────
// The concierge LLM never sees raw engine floats: breakdown parts are turned
// into qualitative Spanish levels here, so there is no number to misquote.

const DIFFICULTY_ES: Record<string, string> = { easy: "fácil", moderate: "moderada", challenging: "exigente" };
const CROWD_ES: Record<string, string> = { low: "pocas", medium: "moderadas", high: "muchas" };
const BUDGET_ES: Record<string, string> = { low: "bajo", mid: "medio", high: "alto" };
const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** How a park is shown to people: Spanish title + /destinos slug (null if not published). */
export interface ParkDisplay {
  title: string;
  slug: string | null;
}

export interface ConciergeRecommendation {
  park_code: string;
  title: string;
  slug: string | null;
  url: string | null;
  nps_url: string;
  /** Engine display-only fit score (0–100); caption as fit, never probability. */
  match_percent: number;
  tied: boolean;
  reasons_es: string[];
}

function fitLevelEs(fit: number): string {
  if (fit >= 0.8) return "muy bien";
  if (fit >= 0.5) return "bien";
  if (fit >= 0.2) return "a medias";
  return "poco";
}

function displayFor(park: RankedPark, displayByCode: Map<string, ParkDisplay>): ParkDisplay {
  return displayByCode.get(park.facts.park_code) ?? { title: park.facts.name, slug: null };
}

function guideUrl(display: ParkDisplay, siteUrl: string): string | null {
  return display.slug ? `${siteUrl}/destinos/${display.slug}` : null;
}

/** Breakdown parts in plain Spanish (§6.2): fit levels + penalties, no raw numbers. */
export function describeBreakdownEs(park: RankedPark): string {
  const b = park.breakdown;
  const parts = [
    `terreno y actividades: encaja ${fitLevelEs(b.content)}`,
    `duración del viaje: encaja ${fitLevelEs(b.days)}`,
    `nivel de esfuerzo: encaja ${fitLevelEs(b.difficulty)}`,
    `costo de viaje: encaja ${fitLevelEs(b.budget)}`,
  ];
  if (b.crowd_penalty > 0) parts.push("más concurrido de lo que prefieres");
  if (b.month_penalty >= OFF_SEASON_PENALTY_THRESHOLD) parts.push("fuera de su mejor temporada para tu fecha");
  else if (b.month_penalty > 0) parts.push("temporada aceptable, no la ideal");
  return parts.join("; ");
}

function describeParkEs(park: RankedPark, profile: TripProfile, display: ParkDisplay, siteUrl: string): string {
  const f = park.facts;
  const months = f.best_months.map((m) => MONTHS_ES[Number(m) - 1] ?? m).join(", ");
  const url = guideUrl(display, siteUrl);
  return [
    `#${park.rank} ${display.title} [park_code: ${f.park_code}] — compatibilidad ${park.match_percent}% (puntaje de ajuste, no probabilidad)${park.tied_with_neighbors ? " — EMPATE TÉCNICO" : ""}`,
    `  Por qué encaja: ${describeBreakdownEs(park)}`,
    `  Rasgos: ${buildSpanishReasons(park, profile, false).join(", ")}`,
    `  Perfil del parque: dificultad ${DIFFICULTY_ES[f.difficulty] ?? f.difficulty}, ${f.days_needed} días sugeridos, multitudes ${CROWD_ES[f.crowd] ?? f.crowd}, costo de viaje ${BUDGET_ES[f.budget_tier] ?? f.budget_tier} (no es la tarifa de entrada), mejores meses: ${months}`,
    f.remote ? "  Remoto: sí (suele requerir vuelo o logística extra)" : "",
    f.permit_likely ? "  Suele requerir permiso o reserva de entrada (dato aproximado, puede estar desactualizado)" : "",
    url ? `  Guía Nomaderia: ${url}` : "",
    `  Oficial (cierres, tarifas, alertas, clima): ${f.nps_url}`,
  ].filter(Boolean).join("\n");
}

/** Tie groups as an explicit instruction (§6.3). */
export function describeTiesEs(result: RecommendResult, displayByCode: Map<string, ParkDisplay>): string {
  if (result.tie_groups.length === 0) return "EMPATES: ninguno.";
  const titleOf = (code: string) =>
    displayByCode.get(code)?.title ?? result.parks.find((p) => p.facts.park_code === code)?.facts.name ?? code;
  return result.tie_groups
    .map((group) => `EMPATE TÉCNICO: ${group.map(titleOf).join(" y ")} — sus puntajes son prácticamente iguales; preséntalos como una decisión cercana, sin inventar un favorito.`)
    .join("\n");
}

/** Full tool result the concierge LLM reads. */
export function describeResultEs(
  result: RecommendResult,
  profile: TripProfile,
  displayByCode: Map<string, ParkDisplay>,
  siteUrl: string,
): string {
  return [
    `RESULTADO DEL MOTOR (v${result.engine_version}) — ${result.parks.length} parque(s), en orden:`,
    ...result.parks.map((p) => describeParkEs(p, profile, displayFor(p, displayByCode), siteUrl)),
    describeTiesEs(result, displayByCode),
    "Solo puedes recomendar estos parques.",
  ].join("\n\n");
}

/** Hard filters that can empty the result — what to ask the user to loosen (§3). */
export function describeEmptyEs(profile: TripProfile): string {
  const filters: string[] = [];
  if (profile.origin_lat != null && profile.origin_lon != null && profile.max_drive_hours != null) {
    filters.push(`máximo ${profile.max_drive_hours} h de manejo desde su punto de salida`);
  }
  if (profile.allow_remote === false) filters.push("sin parques remotos (que requieren vuelo o ferry)");
  if (profile.allow_permits === false) filters.push("sin parques que suelen pedir permiso o reserva de entrada");
  const list = filters.length > 0 ? filters.map((f) => `- ${f}`).join("\n") : "- (ningún filtro duro activo)";
  return `SIN RESULTADOS: ningún parque pasa estos filtros:\n${list}\nPregunta al usuario cuál quiere aflojar. NO sugieras parques.`;
}

export function toRecommendationEs(
  park: RankedPark,
  profile: TripProfile,
  displayByCode: Map<string, ParkDisplay>,
  siteUrl: string,
): ConciergeRecommendation {
  const display = displayFor(park, displayByCode);
  return {
    park_code: park.facts.park_code,
    title: display.title,
    slug: display.slug,
    url: guideUrl(display, siteUrl),
    nps_url: park.facts.nps_url,
    match_percent: park.match_percent,
    tied: park.tied_with_neighbors,
    reasons_es: buildSpanishReasons(park, profile, false),
  };
}

/** Deterministic answer when the LLM keeps naming parks the engine did not return. */
export function fallbackAnswerEs(
  result: RecommendResult,
  profile: TripProfile,
  displayByCode: Map<string, ParkDisplay>,
  siteUrl: string,
): string {
  const lines = result.parks.map((p, i) => {
    const rec = toRecommendationEs(p, profile, displayByCode, siteUrl);
    const guide = rec.url ? ` Guía: ${rec.url}` : "";
    return `${i + 1}. ${rec.title} — ${rec.match_percent}% de compatibilidad (puntaje de ajuste). ${rec.reasons_es.join(", ")}.${guide}`;
  });
  const titleOf = (code: string) => displayByCode.get(code)?.title ?? code;
  const ties = result.tie_groups.map((g) => `${g.map(titleOf).join(" y ")} están prácticamente empatados: es una decisión cercana.`);
  return [
    "Según el motor de recomendaciones de Nomaderia, estas son las opciones que mejor encajan con lo que buscas:",
    lines.join("\n"),
    ...ties,
    "Antes de ir, revisa cierres, tarifas y alertas en la página oficial de cada parque en nps.gov.",
  ].join("\n\n");
}
