/**
 * Product analytics events (Phase 1 funnel).
 *
 * Fire-and-forget insert into public.events. Never throws, never blocks the UI.
 * Distinct from admin_events / trackAdminEvent (admin-only WhatsApp tracking).
 *
 * Requires migration 20260925000000_create_events.sql applied by Frank.
 * Until types are regenerated, inserts use the ADR-009 SupabaseClient cast.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

const SESSION_KEY = "nomaderia_session_id";

function getOrCreateSessionId(): string {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) {
      return crypto.randomUUID();
    }
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function toJsonPayload(payload: Record<string, unknown>): Json {
  return payload as unknown as Json;
}

/**
 * Log a product event. Safe to call from UI handlers and effects.
 *
 * @param type - Event name (e.g. "quiz_answer", "park_selected")
 * @param payload - Arbitrary JSON-serializable context (default {})
 * @param leadId - Optional lead UUID once the client has created one (T05+)
 */
export function logEvent(
  type: string,
  payload: Record<string, unknown> = {},
  leadId: string | null = null,
): void {
  try {
    if (!type || typeof type !== "string") {
      console.warn("[logEvent] skipped: invalid type");
      return;
    }

    const sessionId = getOrCreateSessionId();
    const db = supabase as unknown as SupabaseClient;

    void db
      .from("events")
      .insert({
        session_id: sessionId,
        lead_id: leadId,
        type,
        payload: toJsonPayload(payload),
      })
      .then(({ error }: { error: { message: string } | null }) => {
        if (error) console.warn("[logEvent] insert failed:", error.message);
      });
  } catch (err) {
    console.warn("[logEvent] unexpected:", err);
  }
}
