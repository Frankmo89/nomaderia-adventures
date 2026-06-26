// Distancia entre el usuario y un parque. La matemática haversine se comparte
// entre el chip "Cerca" de /destinos y el cálculo dinámico por ubicación.
// No llama a ninguna API externa: todo es geometría pura y unit-testable.

export interface Origin {
  lat: number;
  lng: number;
  label?: string;
}

export interface LatLng {
  latitude: number | null;
  longitude: number | null;
}

export interface DistanceFromOrigin {
  km: number;
  miles: number;
  /** Estimación cruda de horas en auto (millas / 55). null si se recomienda volar. */
  driveHoursEstimate: number | null;
  /** true cuando la distancia en línea recta supera ~1500 km (vuelo / no contiguo). */
  recommendFlight: boolean;
}

/** Origen por defecto cuando no hay permiso de ubicación: San Diego, CA. */
export const SAN_DIEGO_ORIGIN: Origin = {
  lat: 32.7157,
  lng: -117.1611,
  label: "San Diego",
};

const KM_PER_MILE = 1.60934;
/** Umbral en línea recta a partir del cual sugerimos avión en vez de auto. */
const FLIGHT_THRESHOLD_KM = 1500;
/** Velocidad promedio cruda (mph) para convertir millas → horas de manejo. */
const AVG_DRIVE_MPH = 55;

// Distancia gran-círculo en km. Reutilizada por el chip "Cerca" del directorio.
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export function getDistanceBucket(km: number): "cerca" | "media" | "lejos" {
  if (km < 240) return "cerca";
  if (km <= 640) return "media";
  return "lejos";
}

/**
 * Distancia desde un origen (ubicación del usuario o fallback) hasta un parque.
 * Devuelve null si el parque no tiene coordenadas.
 * `driveHoursEstimate` es una aproximación cruda, NO ruteo turn-by-turn.
 */
export function getDistanceFromOrigin(origin: Origin, park: LatLng): DistanceFromOrigin | null {
  if (park.latitude == null || park.longitude == null) return null;

  const km = haversineKm(origin.lat, origin.lng, park.latitude, park.longitude);
  const miles = km / KM_PER_MILE;
  const recommendFlight = km > FLIGHT_THRESHOLD_KM;

  return {
    km: Math.round(km),
    miles: Math.round(miles),
    driveHoursEstimate: recommendFlight ? null : Math.max(1, Math.round(miles / AVG_DRIVE_MPH)),
    recommendFlight,
  };
}
