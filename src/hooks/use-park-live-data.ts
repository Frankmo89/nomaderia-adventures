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

// Solo los campos que consumen ParkAlertsBanner (alerts) y ParkWeatherCard
// (weather). La tabla NO tiene columna `id` — su clave es `park_code`
// (seleccionar `id` devolvía 400 y los componentes quedaban vacíos en prod).
interface ParkLiveDataRow {
  alerts: ParkAlert[] | null;
  weather: WeatherPayload | null;
}

export function useParkLiveData(destinationId: string | undefined) {
  return useQuery<ParkLiveDataRow | null>({
    queryKey: ["park-live-data", destinationId],
    enabled: !!destinationId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Cast required: los tipos generados están stale para park_live_data
      // (les falta la columna `weather`) — quitar al regenerar tipos (ADR-009)
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
        .select("alerts, weather")
        .eq("destination_id", destinationId as string)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}
