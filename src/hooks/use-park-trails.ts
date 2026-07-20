import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ParkTrailOption = Pick<
  Tables<"park_trails">,
  "id" | "name" | "distance" | "difficulty" | "description_es" | "nps_url"
>;

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
      return (data as ParkTrailOption[]) ?? [];
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
