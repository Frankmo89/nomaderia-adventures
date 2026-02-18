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
}

export function useBlogPosts() {
  return useQuery<BlogPost[]>({
    queryKey: ["blog_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "id, title, slug, category, short_description, hero_image_url, author, created_at"
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as BlogPost[]) ?? [];
    },
  });
}
