import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type BlockType =
  | "ruta"
  | "comida"
  | "alojamiento"
  | "traslado"
  | "tip_seguridad"
  | "permiso"
  | "costo"
  | "nota";

export interface ItineraryBlock {
  id: string;
  tipo: BlockType;
  titulo: string;
  contenido_md?: string | null;
  horario?: string | null;
  precio_usd?: number | null;
  precio_nota?: string | null;
  fuente_url?: string | null;
  afiliado_url?: string | null;
  verify_flag?: string | null;
  distancia_km?: number | null;
  desnivel_m?: number | null;
  apto_principiante?: boolean | null;
  duracion?: string | null;
  modo?: string | null;
}

export interface ItineraryDay {
  dia: number;
  titulo: string;
  bloques: ItineraryBlock[];
}

export interface ItineraryContent {
  version: number;
  parque?: string;
  hero_image_url?: string;
  dias: ItineraryDay[];
}

export interface ClientItinerary {
  client_name: string;
  trip_start: string | null;
  trip_end: string | null;
  content: ItineraryContent;
  status: string;
  updated_at: string;
}

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
