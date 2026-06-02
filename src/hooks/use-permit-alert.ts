import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CreatePermitAlertInput {
  email: string;
  park: string;
  permit_name: string;
  target_year: number;
  notes?: string;
}

interface CreatePermitAlertResult {
  id: string;
  park: string;
}

export function usePermitAlert() {
  const mutation = useMutation<CreatePermitAlertResult, Error, CreatePermitAlertInput>({
    mutationFn: async ({ email, park, permit_name, target_year, notes }: CreatePermitAlertInput): Promise<CreatePermitAlertResult> => {
      const { data, error } = await supabase
        .from("permit_alerts")
        .insert({
          email,
          park,
          permit_name,
          target_year,
          notes: notes?.trim() ? notes.trim() : null,
        })
        .select("id, park")
        .single();

      if (error) throw new Error(error.message);
      if (!data || typeof data !== "object") throw new Error("No pudimos registrar tu alerta en este momento.");

      const row = data as { id?: unknown; park?: unknown };
      if (typeof row.id !== "string" || typeof row.park !== "string") {
        throw new Error("Respuesta inválida al registrar la alerta.");
      }

      return { id: row.id, park: row.park };
    },
  });

  return mutation;
}
