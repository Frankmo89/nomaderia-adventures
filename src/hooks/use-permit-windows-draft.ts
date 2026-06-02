import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PermitWindowsDraftResponse } from "@/types/ai-permits";

export interface GeneratePermitWindowsInput {
  park: string;
  year: number;
}

export function usePermitWindowsDraft() {
  const mutation = useMutation<PermitWindowsDraftResponse, Error, GeneratePermitWindowsInput>({
    mutationFn: async ({ park, year }: GeneratePermitWindowsInput): Promise<PermitWindowsDraftResponse> => {
      const { data, error } = await supabase.functions.invoke<PermitWindowsDraftResponse>(
        "discover-permit-windows",
        {
          body: { park, year },
        },
      );

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Respuesta vacia de discover-permit-windows");

      return data;
    },
  });

  return mutation;
}
