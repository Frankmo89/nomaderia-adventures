import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// park_trails was renamed to park_things_to_do (migration 20260720010000,
// see docs/decisions.md ADR-021), but src/integrations/supabase/types.ts
// still has the table under the old key until Frank regenerates types after
// applying that migration — same bridge pattern as use-media.ts (ADR-009).
// Widen the client type so `.from("park_things_to_do")` compiles.
//   npx supabase gen types typescript --project-id vrixiuvnhvqafmxlcyex > src/integrations/supabase/types.ts
const db = supabase as unknown as ReturnType<typeof createClient>;

export interface ParkThingToDoOption {
  id: string;
  name: string;
  distance: string | null;
  difficulty: string | null;
  description_es: string | null;
  nps_url: string | null;
}

/**
 * Actividades de un parque sincronizadas desde el endpoint /thingstodo de
 * NPS (rutas, paseos guiados, remo, ciclismo, programas de guardaparques,
 * miradores, etc.) — para el autocomplete de bloques `ruta` en el itinerary
 * builder. Solo lectura. Distinta de useSignatureHikes: esta es un sync
 * automático sin curar, no contenido editorial (ver ADR-021).
 */
export function useParkThingsToDo(destinationId?: string | null) {
  return useQuery<ParkThingToDoOption[]>({
    queryKey: ["park-things-to-do", destinationId],
    enabled: !!destinationId,
    queryFn: async () => {
      const { data, error } = await db
        .from("park_things_to_do")
        .select("id, name, distance, difficulty, description_es, nps_url")
        .eq("destination_id", destinationId!)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data as ParkThingToDoOption[]) ?? [];
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
