// src/hooks/use-concierge.ts
// Hook para el concierge IA de Nomaderia
// Patrón: useMutation (TanStack Query) — acción del usuario, no fetch de datos
//
// Producto: este chat es de visitantes anónimos. NUNCA trae whatsapp_url —
// ese CTA vive solo en /i/:token, para clientes que ya pagaron. Cuando escala,
// el backend manda quiz_url; ConciergeChat ofrece el quiz + captura de correo.

import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAnalyticsSessionId, logEvent } from "@/lib/events";

export interface ConciergeSource {
  title:   string;
  slug:    string;
  section: string;
  url:     string;
}

export interface ConciergeResponse {
  answer:         string;
  sources:        ConciergeSource[];
  escalate:       boolean;
  quiz_url?:      string;
  engine_version?: string;
  answer_check?:  string;
  ask_email?:     boolean;
  chunk_ids?:     string[];
  logged?:        boolean;
  unconfirmed?:   boolean;
  session_id?:    string;
}

export interface ConciergeMessage {
  id:        string;
  role:      "user" | "assistant";
  content:   string;
  sources?:  ConciergeSource[];
  escalate?: boolean;
  quiz_url?: string;
  ask_email?: boolean;
}

export function useConcierge() {
  const mutation = useMutation({
    mutationFn: async ({
      question,
      destination_slug,
      prior_answers,
    }: {
      question:          string;
      destination_slug?: string;
      prior_answers?:    number;
    }): Promise<ConciergeResponse> => {
      const session_id = getAnalyticsSessionId();
      const { data, error } = await supabase.functions.invoke<ConciergeResponse>(
        "concierge-agent",
        {
          body: { question, destination_slug, session_id, prior_answers: prior_answers ?? 0 },
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (error) throw new Error(error.message);
      if (!data)  throw new Error("Respuesta vacía del concierge");

      logEvent("concierge_answer_check", {
        answer_check:  data.answer_check ?? "ok",
        escalate:      data.escalate,
        park_mode:     Boolean(destination_slug),
        engine_version: data.engine_version ?? null,
        unconfirmed:   data.unconfirmed ?? false,
      });
      // The edge function logs question/answer/chunk ids with the service role.
      // If that insert did not happen, keep a copy from the browser.
      if (!data.logged) {
        logEvent("concierge_turn", {
          question,
          answer: data.answer,
          chunk_ids: data.chunk_ids ?? [],
          destination_slug: destination_slug ?? null,
          answer_check: data.answer_check ?? "ok",
        });
      }

      return data;
    },
  });

  return mutation;
}
