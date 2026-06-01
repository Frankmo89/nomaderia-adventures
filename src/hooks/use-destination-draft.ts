import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GenerateDraftResponse } from "@/types/ai-destinations";

export interface GenerateDraftInput {
  title: string;
  country: string;
  suggested_slug?: string;
}

export function useDestinationDraft() {
  const mutation = useMutation<GenerateDraftResponse, Error, GenerateDraftInput>({
    mutationFn: async ({ title, country, suggested_slug }: GenerateDraftInput): Promise<GenerateDraftResponse> => {
      const { data, error } = await supabase.functions.invoke<GenerateDraftResponse>(
        "generate-destination-draft",
        {
          body: { title, country, suggested_slug },
        }
      );

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Respuesta vacía de generate-destination-draft");

      return data;
    },
  });

  return mutation;
}
