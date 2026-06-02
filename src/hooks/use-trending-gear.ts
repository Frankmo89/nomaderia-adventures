import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DiscoverGearResponse } from "@/types/ai-gear";

export function useTrendingGear() {
  const mutation = useMutation<DiscoverGearResponse, Error, void>({
    mutationFn: async (): Promise<DiscoverGearResponse> => {
      const { data, error } = await supabase.functions.invoke<DiscoverGearResponse>(
        "discover-trending-gear",
      );

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Respuesta vacía de discover-trending-gear");

      return data;
    },
  });

  return mutation;
}
