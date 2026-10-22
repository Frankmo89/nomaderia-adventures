/**
 * Pure helpers for the landing's parks section ("Ruta + vidrio" design).
 * Every label comes from a destinations column; when a value does not parse
 * cleanly the label is left out rather than guessed.
 */

export interface DriveTime {
  /** Lower bound in hours, used to sort ("7.5-8" → 7.5). */
  hours: number;
  /** Short label for the route: "3 h", "7.5–8 h", "44+ h". */
  label: string;
}

/**
 * "3 horas en coche" → { hours: 3, label: "3 h" }.
 * "7.5-8 horas en coche (South Rim)" → { hours: 7.5, label: "7.5–8 h" }.
 * Only a plain drive counts: "3 horas en coche a Ventura" (Channel Islands,
 * then a boat), "Sin carretera…", "Vuelo vía…" return null.
 */
export function parseDriveFromSanDiego(raw: string | null | undefined): DriveTime | null {
  if (!raw) return null;
  const m = raw
    .trim()
    .match(/^(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?(\+)?\s+horas?\s+en\s+coche\s*(?:\(.*\))?$/i);
  if (!m) return null;
  const [, min, max, plus] = m;
  const label = max ? `${min}–${max} h` : `${min}${plus ? "+" : ""} h`;
  return { hours: Number(min), label };
}

const MONTH_OR_SEASON =
  /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|primavera|verano|oto[ñn]o|invierno|todo el a[ñn]o|cualquier [ée]poca|mediados|principios|finales)/i;

/**
 * First clause of best_season, if it reads as a time of year:
 * "Octubre a abril, con clima templado…" → "Octubre a abril".
 * "Marzo-mayo y septiembre-noviembre: clima…" → "Marzo–mayo y septiembre–noviembre".
 */
export function shortBestSeason(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const first = raw
    .split(/[:,.;(—]| para | con | cuando | si | por | es /)[0]
    .trim();
  if (!first || first.length > 44 || !MONTH_OR_SEASON.test(first)) return null;
  return first.replace(/(\p{L})-(\p{L})/gu, "$1–$2");
}

/** 30 + "por vehículo" → "$30 por carro"; 0 or "gratis" → "Entrada gratis". */
export function entranceFeeLabel(
  fee: number | string | null | undefined,
  type: string | null | undefined,
): string | null {
  const n = fee == null || fee === "" ? NaN : Number(fee);
  if (type === "gratis" || n === 0) return "Entrada gratis";
  if (!Number.isFinite(n)) return null;
  const amount = Number.isInteger(n) ? String(n) : n.toFixed(2);
  const per = type === "por vehículo" ? "por carro" : type ?? "";
  return `$${amount} ${per}`.trim();
}

/** "2-3 días" → "2–3 días". */
export function daysLabel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return raw.trim().replace(/(\d)\s*-\s*(\d)/g, "$1–$2");
}

interface Hike {
  nombre?: unknown;
  distancia_km?: unknown;
  tipo?: unknown;
  apto_ninos?: unknown;
}

/**
 * The first hike marked kid-friendly, as one line:
 * "Hidden Valley Nature Trail, 1.6 km en circuito". None marked → null.
 */
export function firstEasyTrail(hikes: unknown): string | null {
  if (!Array.isArray(hikes)) return null;
  const hike = (hikes as Hike[]).find(
    (h) => h && (h.apto_ninos === true || h.apto_ninos === "true") && typeof h.nombre === "string",
  );
  if (!hike) return null;
  const name = String(hike.nombre).trim();
  const km = Number(hike.distancia_km);
  const kind = hike.tipo === "circuito" ? "en circuito" : hike.tipo === "ida y vuelta" ? "ida y vuelta" : "";
  if (!Number.isFinite(km) || km <= 0) return name;
  return `${name}, ${km} km${kind ? ` ${kind}` : ""}`;
}

/**
 * "Parque Nacional del Gran Cañón" → "Gran Cañón";
 * "Parque Nacional y Reserva Great Sand Dunes" → "Great Sand Dunes".
 */
export function parkShortName(title: string): string {
  return (
    title.replace(/^Parques?\s+Nacional(?:es)?\s+(?:y\s+Reserva\s+)?(?:del?\s+)?/i, "").trim() || title
  );
}

const LEVEL_ORDER: Record<string, number> = { easy: 0, moderate: 1, challenging: 2 };

/** Nearest first; parks with no plain drive go last; ties: easier, then A–Z. */
export function sortByDriveFromSanDiego<
  T extends { title: string; difficulty_level: string; drive_time_from_san_diego: string | null },
>(parks: T[]): T[] {
  const key = (p: T) => parseDriveFromSanDiego(p.drive_time_from_san_diego)?.hours ?? Infinity;
  return [...parks].sort(
    (a, b) =>
      key(a) - key(b) ||
      (LEVEL_ORDER[a.difficulty_level] ?? 9) - (LEVEL_ORDER[b.difficulty_level] ?? 9) ||
      a.title.localeCompare(b.title, "es"),
  );
}
