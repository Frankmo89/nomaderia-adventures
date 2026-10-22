/**
 * Where the landing's park route starts (ADR-041).
 *
 * San Diego is the default and uses the real hours in
 * destinations.drive_time_from_san_diego. Any other US ZIP gets the ranking
 * engine's straight-line estimate (great-circle miles × 1.25 / 65 mph, the
 * same number the quiz filters on), rounded up and shown with "≈".
 *
 * Measured 2026-10-22 against the 49 real San Diego hours: median error +3%,
 * 10th–90th percentile −12% to +27%. It runs short where roads go around
 * something (Las Vegas → Sequoia across the Sierra Nevada: ≈4 h vs ~6 h).
 */
import { driveHours } from "@engine/engine";
import { ENGINE_DATA } from "@engine/engine-data.generated";
import { isIslandZip, isValidZipFormat } from "@/lib/zip-centroids";
import { parseDriveFromSanDiego } from "@/lib/landing-parks";

export interface LatLon {
  lat: number;
  lon: number;
}

export type RouteOrigin = { kind: "san-diego" } | { kind: "zip"; zip: string; lat: number; lon: number };

export const SAN_DIEGO_ORIGIN: RouteOrigin = { kind: "san-diego" };

/** Downtown San Diego. */
export const SAN_DIEGO: LatLon = { lat: 32.7157, lon: -117.1611 };

/** Straight-line drive estimate from the ranking engine, in hours. */
export function estimateDriveHours(from: LatLon, to: LatLon): number {
  return driveHours(from.lat, from.lon, to.lat, to.lon, ENGINE_DATA);
}

/**
 * A ZIP within half an hour (estimated) of downtown San Diego is San Diego:
 * it gets the real hours, not an estimate.
 */
export function isSanDiegoArea(point: LatLon): boolean {
  return estimateDriveHours(SAN_DIEGO, point) <= 0.5;
}

/** Alaska (995–999). Its road trips to this route go through Canada. */
export function isAlaskaZip(zip: string): boolean {
  return isValidZipFormat(zip) && Number(zip.slice(0, 3)) >= 995;
}

/** Islands, territories and Alaska: no road trip from home to the parks on this route. */
export function isOffRouteZip(zip: string): boolean {
  return isIslandZip(zip) || isAlaskaZip(zip);
}

/**
 * Round up so a beginner never gets less time than we said: half hours
 * under 10 h, whole hours from 10 h. Never below half an hour.
 */
export function roundUpDriveHours(hours: number): number {
  if (!Number.isFinite(hours) || hours <= 0.5) return 0.5;
  return hours < 10 ? Math.ceil(hours * 2) / 2 : Math.ceil(hours);
}

export interface DriveFromOrigin {
  /** Used to sort: real lower bound from San Diego, raw estimate otherwise. */
  hours: number;
  /** "3 h", "7.5–8 h", or for an estimate "≈ 2.5 h". */
  label: string;
  estimated: boolean;
}

interface RoutePark {
  drive_time_from_san_diego: string | null;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Drive from the origin to a park, or null when the park is not a road trip.
 * Road trip = the San Diego column reads as a plain drive (no boat, flight
 * or roadless park), so the same parks are on the route from any origin.
 */
export function driveFromOrigin(origin: RouteOrigin, park: RoutePark): DriveFromOrigin | null {
  const fromSanDiego = parseDriveFromSanDiego(park.drive_time_from_san_diego);
  if (!fromSanDiego) return null;
  if (origin.kind === "san-diego") {
    return { hours: fromSanDiego.hours, label: fromSanDiego.label, estimated: false };
  }
  if (park.latitude == null || park.longitude == null) return null;
  const hours = estimateDriveHours(origin, { lat: park.latitude, lon: park.longitude });
  return { hours, label: `≈ ${roundUpDriveHours(hours)} h`, estimated: true };
}

const LEVEL_ORDER: Record<string, number> = { easy: 0, moderate: 1, challenging: 2 };

/** Road-trip parks from the origin, nearest first; ties: easier, then A–Z. */
export function routeFrom<T extends RoutePark & { title: string; difficulty_level: string }>(
  parks: T[],
  origin: RouteOrigin,
): { park: T; drive: DriveFromOrigin }[] {
  return parks
    .map((park) => ({ park, drive: driveFromOrigin(origin, park) }))
    .filter((s): s is { park: T; drive: DriveFromOrigin } => s.drive !== null)
    .sort(
      (a, b) =>
        a.drive.hours - b.drive.hours ||
        (LEVEL_ORDER[a.park.difficulty_level] ?? 9) - (LEVEL_ORDER[b.park.difficulty_level] ?? 9) ||
        a.park.title.localeCompare(b.park.title, "es"),
    );
}

/** The origin for a looked-up ZIP: San Diego when the ZIP is in the San Diego area. */
export function originFromZip(zip: string, point: LatLon): RouteOrigin {
  return isSanDiegoArea(point) ? SAN_DIEGO_ORIGIN : { kind: "zip", zip, lat: point.lat, lon: point.lon };
}

// ── Remembered ZIP (per viewer, this browser only) ─────────────────────────

export const ORIGIN_STORAGE_KEY = "nomaderia_route_origin";

interface SavedOrigin {
  zip: string;
  lat: number;
  lon: number;
}

/** The saved ZIP origin, or null. Storage can be missing or throw; both mean "none". */
export function readSavedOrigin(): RouteOrigin | null {
  try {
    const raw = window.localStorage.getItem(ORIGIN_STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<SavedOrigin>;
    if (
      typeof saved.zip !== "string" ||
      !isValidZipFormat(saved.zip) ||
      typeof saved.lat !== "number" ||
      typeof saved.lon !== "number" ||
      !Number.isFinite(saved.lat) ||
      !Number.isFinite(saved.lon)
    ) {
      return null;
    }
    return { kind: "zip", zip: saved.zip, lat: saved.lat, lon: saved.lon };
  } catch {
    return null;
  }
}

/** Remember a ZIP origin; San Diego clears it. Failures are ignored. */
export function saveOrigin(origin: RouteOrigin): void {
  try {
    if (origin.kind === "san-diego") {
      window.localStorage.removeItem(ORIGIN_STORAGE_KEY);
    } else {
      const saved: SavedOrigin = { zip: origin.zip, lat: origin.lat, lon: origin.lon };
      window.localStorage.setItem(ORIGIN_STORAGE_KEY, JSON.stringify(saved));
    }
  } catch {
    // Private mode or blocked storage: the route still works for this visit.
  }
}
