import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type GearArticle = Tables<"gear_articles">;

/** Solo las columnas que renderizan las cards del listado /gear (GearListing). */
export type GearArticleListItem = Pick<
  GearArticle,
  "id" | "title" | "slug" | "category" | "short_description" | "hero_image_url" | "created_at"
>;

interface GearArticleCard {
  id: string;
  title: string;
  slug: string;
  category: string;
  short_description: string;
}

export function useGearArticles() {
  return useQuery<GearArticleListItem[]>({
    queryKey: ["gear_articles"],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gear_articles")
        .select("id, title, slug, category, short_description, hero_image_url, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as GearArticleListItem[]) ?? [];
    },
  });
}

export function useFeaturedGearArticles() {
  return useQuery<GearArticleCard[]>({
    queryKey: ["gear_articles", "featured"],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gear_articles")
        .select("id, title, slug, category, short_description")
        .eq("is_published", true)
        .eq("featured", true)
        .limit(3);
      if (error) throw error;
      return (data as GearArticleCard[]) ?? [];
    },
  });
}
