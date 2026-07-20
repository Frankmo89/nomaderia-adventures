import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SignatureHike } from "@/components/destinations/TrailCards";

/**
 * Senderos curados (`destinations.signature_hikes`) de un parque, para el
 * autocomplete de bloques `ruta` en el itinerary builder. Solo lectura.
 * Distinta de useParkThingsToDo (ADR-021): signature_hikes es contenido
 * editorial curado a mano en `destinations`; park_things_to_do es un sync
 * automático sin curar de NPS /thingstodo. Fuentes distintas — no mezclar.
 */
export function useSignatureHikes(destinationId?: string | null) {
  return useQuery<SignatureHike[]>({
    queryKey: ["signature-hikes", destinationId],
    enabled: !!destinationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select("signature_hikes")
        .eq("id", destinationId!)
        .maybeSingle();
      if (error) throw error;
      const hikes = (data?.signature_hikes as unknown as SignatureHike[] | null) ?? [];
      return hikes.filter((h) => h?.nombre?.trim());
    },
  });
}
