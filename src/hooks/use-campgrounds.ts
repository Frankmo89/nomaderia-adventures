import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CampgroundOption = Pick<
  Tables<"campgrounds">,
  | "id"
  | "nombre"
  | "precio_usd"
  | "precio_nota"
  | "reserva_url"
  | "dentro_del_parque"
  | "es_recomendado"
>;

/**
 * Campgrounds curados de un parque, para el autocomplete de bloques
 * `alojamiento` en el itinerary builder. Solo lectura.
 */
export function useCampgrounds(destinationId?: string | null) {
  return useQuery<CampgroundOption[]>({
    queryKey: ["campgrounds", destinationId],
    enabled: !!destinationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campgrounds")
        .select("id, nombre, precio_usd, precio_nota, reserva_url, dentro_del_parque, es_recomendado")
        .eq("destination_id", destinationId!)
        .order("es_recomendado", { ascending: false })
        .order("nombre", { ascending: true });
      if (error) throw error;
      return (data as CampgroundOption[]) ?? [];
    },
  });
}
