import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type {
  BlockType,
  ItineraryBlock,
  ItineraryDay,
  ItineraryContent,
  ClientItinerary,
} from "@/types/itinerary";

// Tipos canónicos en @/types/itinerary (ADR-018); re-export para no romper imports.
export type { BlockType, ItineraryBlock, ItineraryDay, ItineraryContent, ClientItinerary };

const db = supabase as unknown as SupabaseClient;

export function useClientItinerary(token: string) {
  return useQuery<ClientItinerary | null>({
    queryKey: ["client-itinerary", token],
    queryFn: async () => {
      const { data, error } = await db.rpc("get_itinerary_by_token", {
        p_token: token,
      });
      if (error) throw error;
      if (!data) return null;
      const rows = data as ClientItinerary[];
      return rows.length > 0 ? rows[0] : null;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
