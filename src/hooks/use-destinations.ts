import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Destination = Tables<"destinations">;

interface DestinationCard {
  id: string;
  title: string;
  slug: string;
  country: string;
  short_description: string;
  difficulty_level: string;
  days_needed: string;
  estimated_budget_usd: number;
  hero_image_url: string;
  tags: string[];
}

export function useDestinations() {
  return useQuery<DestinationCard[]>({
    queryKey: ["destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select(
          "id, title, slug, country, short_description, difficulty_level, days_needed, estimated_budget_usd, hero_image_url, tags"
        )
        .eq("is_published", true);
      if (error) throw error;
      return (data as DestinationCard[]) ?? [];
    },
  });
}

export function useDestinationBySlug(slug: string | undefined) {
  return useQuery<Destination | null>({
    queryKey: ["destination", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

export function useRelatedDestinations(
  difficultyLevel: string | undefined,
  excludeId: string | undefined
) {
  return useQuery<Destination[]>({
    queryKey: ["destinations", "related", difficultyLevel, excludeId],
    queryFn: async () => {
      if (!difficultyLevel || !excludeId) return [];
      const { data, error } = await supabase
        .from("destinations")
        .select(
          "id, title, slug, country, difficulty_level, days_needed, estimated_budget_usd, hero_image_url, short_description"
        )
        .eq("is_published", true)
        .eq("difficulty_level", difficultyLevel)
        .neq("id", excludeId)
        .limit(3);
      if (error) throw error;
      return (data as Destination[]) ?? [];
    },
    enabled: !!difficultyLevel && !!excludeId,
  });
}
