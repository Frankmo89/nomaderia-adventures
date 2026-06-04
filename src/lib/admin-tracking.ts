import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export function trackAdminEvent(
  event_type: string,
  lead_email: string | null,
  lead_source: string | null,
  metadata?: Record<string, string | null>
): void {
  supabase
    .from("admin_events")
    .insert({
      event_type,
      lead_email,
      lead_source,
      metadata: (metadata ?? null) as unknown as Json | null,
    })
    .then(({ error }) => {
      if (error) console.warn("[trackAdminEvent] insert failed:", error.message);
    });
}
