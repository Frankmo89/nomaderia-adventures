import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type NewsletterSliderImage = Pick<
  Tables<"media_slider">,
  "id" | "public_url" | "display_order"
>;

export function useNewsletterSliderImages() {
  return useQuery<NewsletterSliderImage[]>({
    queryKey: ["media_slider", "newsletter-images"],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_slider")
        .select("id, public_url, display_order")
        .eq("media_type", "image")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data as NewsletterSliderImage[]) ?? [];
    },
  });
}
