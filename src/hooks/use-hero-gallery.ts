import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GalleryHeroPhoto } from "@/lib/hero-slides";

/**
 * Photos Frank keeps active in /admin/galeria, in his order, for the home hero
 * (ADR-046). Images only; videos stay in the gallery's other slideshows.
 */
export function useHeroGalleryPhotos() {
  return useQuery<GalleryHeroPhoto[]>({
    queryKey: ["media_slider", "hero-photos"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_slider")
        .select("id, public_url, caption, display_order")
        .eq("media_type", "image")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(({ id, public_url, caption }) => ({ id, public_url, caption }));
    },
  });
}
