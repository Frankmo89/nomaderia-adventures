import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GenerateBlogResponse } from "@/types/ai-blog";

export interface GenerateBlogInput {
  title: string;
  category?: string;
  suggested_slug?: string;
}

export function useBlogDraft() {
  const mutation = useMutation<GenerateBlogResponse, Error, GenerateBlogInput>({
    mutationFn: async ({ title, category, suggested_slug }: GenerateBlogInput): Promise<GenerateBlogResponse> => {
      const { data, error } = await supabase.functions.invoke<GenerateBlogResponse>(
        "generate-blog-draft",
        {
          body: { title, category, suggested_slug },
        },
      );

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Respuesta vacia de generate-blog-draft");

      return data;
    },
  });

  return mutation;
}
