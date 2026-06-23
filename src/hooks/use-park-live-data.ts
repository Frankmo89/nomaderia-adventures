import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ParkAlert {
  category: "Danger" | "Closure" | "Caution" | "Information" | string;
  title: string;
  description: string;
  url?: string | null;
}

export interface WeatherPeriod {
  name: string;
  is_daytime: boolean;
  temp_f: number;
  short: string;
  detailed: string;
  precip_pct: number | null;
  wind: string;
}

export interface WeatherPayload {
  synced_at: string;
  source: string;
  periods: WeatherPeriod[];
}

// park_live_data not in generated types — local interface per ADR-009
interface ParkLiveDataRow {
  id: string;
  destination_id: string | null;
  park_code: string | null;
  alerts: ParkAlert[] | null;
  weather: WeatherPayload | null;
  synced_at: string | null;
}

export function useParkLiveData(destinationId: string | undefined) {
  return useQuery<ParkLiveDataRow | null>({
    queryKey: ["park-live-data", destinationId],
    enabled: !!destinationId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Cast required: park_live_data is not in generated supabase types (ADR-009)
      const client = supabase as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, val: string) => {
              maybeSingle: () => Promise<{ data: ParkLiveDataRow | null; error: { message: string } | null }>;
            };
          };
        };
      };
      const { data, error } = await client
        .from("park_live_data")
        .select("id, destination_id, park_code, alerts, weather, synced_at")
        .eq("destination_id", destinationId as string)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}
