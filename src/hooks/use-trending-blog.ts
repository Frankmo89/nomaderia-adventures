import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DiscoverBlogResponse } from "@/types/ai-blog";

export function useTrendingBlog() {
  const mutation = useMutation<DiscoverBlogResponse, Error, string | undefined>({
    mutationFn: async (focus?: string): Promise<DiscoverBlogResponse> => {
      const { data, error } = await supabase.functions.invoke<DiscoverBlogResponse>(
        "discover-trending-blog",
        { body: { focus } },
      );

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Respuesta vacia de discover-trending-blog");

      return data;
    },
  });

  return mutation;
}
