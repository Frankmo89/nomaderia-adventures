import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useQuizCount() {
  return useQuery({
    queryKey: ["quiz-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("quiz_responses")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useDestinationsCount() {
  return useQuery({
    queryKey: ["destinations-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("destinations")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true);
      if (error) throw error;
      return count ?? 0;
    },
  });
}
