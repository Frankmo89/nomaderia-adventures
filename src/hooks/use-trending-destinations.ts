import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DiscoverResponse } from "@/types/ai-destinations";

export function useTrendingDestinations() {
  const mutation = useMutation<DiscoverResponse, Error, void>({
    mutationFn: async (): Promise<DiscoverResponse> => {
      const { data, error } = await supabase.functions.invoke<DiscoverResponse>(
        "discover-trending-destinations"
      );

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Respuesta vacía de discover-trending-destinations");

      return data;
    },
  });

  return mutation;
}
