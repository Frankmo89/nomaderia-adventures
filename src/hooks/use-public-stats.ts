import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STALE_TIME = 30 * 60 * 1000; // 30 minutes

async function fetchCount(
  table: "destinations" | "blog_posts" | "quiz_responses" | "newsletter_subscribers",
  filter?: { column: string; value: boolean }
): Promise<number> {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) {
    query = query.eq(filter.column, filter.value);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export interface PublicStats {
  destinations: number;
  blogPosts: number;
  quizResponses: number;
  newsletterSubscribers: number;
}

export function usePublicStats() {
  return useQuery<PublicStats>({
    queryKey: ["public-stats"],
    staleTime: STALE_TIME,
    queryFn: async (): Promise<PublicStats> => {
      const [destinations, blogPosts, quizResponses, newsletterSubscribers] =
        await Promise.all([
          fetchCount("destinations", { column: "is_published", value: true }),
          fetchCount("blog_posts", { column: "is_published", value: true }),
          fetchCount("quiz_responses"),
          fetchCount("newsletter_subscribers"),
        ]);
      return { destinations, blogPosts, quizResponses, newsletterSubscribers };
    },
  });
}
