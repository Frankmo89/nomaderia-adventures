import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ParkTrailOption = Pick<
  Tables<"park_trails">,
  "id" | "name" | "distance" | "difficulty" | "description_es" | "nps_url"
>;

// STOPGAP heuristic — see docs/pending-tasks.md ("park_trails data source
// likely wrong at la raíz"). park_trails is synced from NPS's /thingstodo
// endpoint (activity=Hiking), which mixes real named trails ("Hike Ryan
// Mountain") with non-hiking activities ("Attend a Ranger Stroll", "Rock
// Climbing at Echo T") under the exact same URL pattern — the two can't be
// told apart by source/URL, only by guessing from the title. This filter is
// NOT a real classification: it both hides some real trails (e.g. "Minong
// Section 4: Hike from North Desor to Windigo" — doesn't start with "Hike"
// or contain "Trail") and keeps some non-hiking items (e.g. ski/bike trails).
// Remove once park_trails is re-synced from a real trails data source.
const TRAIL_NAME_ALLOW = /(^hike\b|\btrail(s)?\b|^walk the\b)/i;
const NON_TRAIL_KEYWORDS =
  /\b(attend|become|junior ranger|biking|birding|stargazing|rock climbing|bouldering|drive|paddle|portage|horseback|photographing|visit the|backpacking)\b/i;

function looksLikeTrail(name: string): boolean {
  return TRAIL_NAME_ALLOW.test(name) && !NON_TRAIL_KEYWORDS.test(name);
}

/**
 * Senderos oficiales (NPS) de un parque, para el autocomplete de bloques
 * `ruta` en el itinerary builder. Solo lectura.
 */
export function useParkTrails(destinationId?: string | null) {
  return useQuery<ParkTrailOption[]>({
    queryKey: ["park-trails", destinationId],
    enabled: !!destinationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("park_trails")
        .select("id, name, distance, difficulty, description_es, nps_url")
        .eq("destination_id", destinationId!)
        .order("name", { ascending: true });
      if (error) throw error;
      return ((data as ParkTrailOption[]) ?? []).filter((t) => looksLikeTrail(t.name));
    },
  });
}

/** "1.6 km", "3.2 mi", "aprox. 2 km" → km numérico (1 decimal) o null. */
export function parseDistanceKm(distance: string | null): number | null {
  if (!distance) return null;
  const m = distance.match(/([\d.]+)/);
  if (!m) return null;
  const value = Number(m[1]);
  if (!Number.isFinite(value)) return null;
  const km = /mi/i.test(distance) ? value * 1.609 : value;
  return Math.round(km * 10) / 10;
}
