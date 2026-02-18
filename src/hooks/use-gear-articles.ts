import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type GearArticle = Tables<"gear_articles">;

interface GearArticleCard {
  id: string;
  title: string;
  slug: string;
  category: string;
  short_description: string;
}

export function useGearArticles() {
  return useQuery<GearArticle[]>({
    queryKey: ["gear_articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gear_articles")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFeaturedGearArticles() {
  return useQuery<GearArticleCard[]>({
    queryKey: ["gear_articles", "featured"],
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
