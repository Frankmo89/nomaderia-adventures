import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GenerateGearResponse } from "@/types/ai-gear";

export interface GenerateGearInput {
  title: string;
  category: string;
  suggested_slug?: string;
  destination_id?: string;
}

export function useGearDraft() {
  const mutation = useMutation<GenerateGearResponse, Error, GenerateGearInput>({
    mutationFn: async ({ title, category, suggested_slug, destination_id }: GenerateGearInput): Promise<GenerateGearResponse> => {
      const { data, error } = await supabase.functions.invoke<GenerateGearResponse>(
        "generate-gear-draft",
        {
          body: { title, category, suggested_slug, destination_id },
        },
      );

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Respuesta vacía de generate-gear-draft");

      return data;
    },
  });

  return mutation;
}
