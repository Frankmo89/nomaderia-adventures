// Parses the raw NPS API coordinate string stored in park_live_data.lat_long,
// e.g. "lat:36.0544, long:-112.1401". Not used by the current map-data hook
// (destinations.latitude/longitude is the primary source — see
// use-destinations.ts) but kept as a documented fallback for the raw NPS
// format if that ever becomes the only available source for a park.
export function parseNpsLatLong(raw: string | null): { lat: number; lng: number } | null {
  if (!raw) return null;

  const match = /lat:\s*(-?\d+(?:\.\d+)?)\s*,\s*long:\s*(-?\d+(?:\.\d+)?)/i.exec(raw);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}
