// src/hooks/use-concierge.ts
// Hook para el concierge IA de Nomaderia
// Patrón: useMutation (TanStack Query) — acción del usuario, no fetch de datos
//
// Producto: este chat es de visitantes anónimos. NUNCA trae whatsapp_url —
// ese CTA vive solo en /i/:token, para clientes que ya pagaron. Cuando escala,
// el backend manda quiz_url; ConciergeChat ofrece el quiz + captura de correo.

import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logEvent } from "@/lib/events";

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
  answer_check?:  "ok" | "regenerated" | "fallback";
}

export interface ConciergeMessage {
  id:        string;
  role:      "user" | "assistant";
  content:   string;
  sources?:  ConciergeSource[];
  escalate?: boolean;
  quiz_url?: string;
}

export function useConcierge() {
  const mutation = useMutation({
    mutationFn: async ({
      question,
      destination_slug,
    }: {
      question:          string;
      destination_slug?: string;
    }): Promise<ConciergeResponse> => {
      const { data, error } = await supabase.functions.invoke<ConciergeResponse>(
        "concierge-agent",
        {
          body: { question, destination_slug },
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (error) throw new Error(error.message);
      if (!data)  throw new Error("Respuesta vacía del concierge");

      // Mismo patrón que quiz_results_ranked / park_selected (src/hooks/use-quiz.ts):
      // logEvent es fire-and-forget, nunca bloquea ni rompe la respuesta al usuario.
      logEvent("concierge_answer_check", {
        answer_check:  data.answer_check ?? "ok",
        escalate:      data.escalate,
        park_mode:     Boolean(destination_slug),
        engine_version: data.engine_version ?? null,
      });

      return data;
    },
  });

  return mutation;
}
