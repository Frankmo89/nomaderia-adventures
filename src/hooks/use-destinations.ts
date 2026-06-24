import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Destination = Tables<"destinations">;

export interface DestinationCard {
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
  affiliate_links: Record<string, string> | null;
}

export function useDestinations() {
  return useQuery<DestinationCard[]>({
    queryKey: ["destinations"],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select(
          "id, title, slug, country, short_description, difficulty_level, days_needed, estimated_budget_usd, hero_image_url, tags, affiliate_links"
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
    staleTime: 30 * 60 * 1000,
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

export interface ParkCard {
  id: string;
  title: string;
  slug: string;
  hero_image_url: string | null;
  difficulty_level: string;
  experience_type: string | null;
  short_description: string | null;
  access_type: string | null;
  access_difficulty: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  drive_time_from_san_diego: string | null;
  nearest_airport: string | null;
  requires_permit: boolean | null;
  estimated_budget_usd: number | null;
  cell_signal_status: string | null;
  camping_available: boolean;
}

export function useDestinationsDirectory() {
  return useQuery<ParkCard[]>({
    queryKey: ["destinations", "directory"],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select(
          "id, title, slug, hero_image_url, difficulty_level, experience_type, short_description, access_type, access_difficulty, region, latitude, longitude, drive_time_from_san_diego, nearest_airport, requires_permit, estimated_budget_usd, cell_signal_status, camping_available"
        )
        .eq("is_published", true)
        .order("title");
      if (error) throw error;
      return (data as ParkCard[]) ?? [];
    },
  });
}

export interface HeroPark {
  id: string;
  title: string;
  slug: string;
  hero_image_url: string | null;
  difficulty_level: string;
  region: string | null;
  requires_permit: boolean | null;
  drive_time_from_san_diego: string | null;
  experience_type: string | null;
  latitude: number | null;
  longitude: number | null;
}

export function useFeaturedHeroPark() {
  return useQuery<HeroPark[]>({
    queryKey: ["destinations", "hero-featured"],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select(
          "id, title, slug, hero_image_url, difficulty_level, region, requires_permit, drive_time_from_san_diego, experience_type, latitude, longitude"
        )
        .eq("featured", true)
        .eq("beginner_friendly", true)
        .not("hero_image_url", "is", null)
        .eq("is_published", true);
      if (error) throw error;
      return (data as HeroPark[]) ?? [];
    },
  });
}

export function useRelatedDestinations(
  difficultyLevel: string | undefined,
  excludeId: string | undefined
) {
  return useQuery<Destination[]>({
    queryKey: ["destinations", "related", difficultyLevel, excludeId],
    staleTime: 30 * 60 * 1000,
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
