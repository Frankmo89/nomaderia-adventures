import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  short_description: string | null;
  hero_image_url: string | null;
  author: string | null;
  created_at: string;
  featured: boolean | null;
  reading_time_min: number | null;
  tags: string[] | null;
}

export type { BlogPost };

export function useBlogPosts() {
  return useQuery<BlogPost[]>({
    queryKey: ["blog_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "id, title, slug, category, short_description, hero_image_url, author, created_at, featured, reading_time_min, tags"
        )
        .eq("is_published", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as BlogPost[]) ?? [];
    },
  });
}
