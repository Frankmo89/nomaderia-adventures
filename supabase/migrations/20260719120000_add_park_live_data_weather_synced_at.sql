-- Timestamps de sync por fuente en park_live_data.
-- Motivo: synced_at lo escribe solo sync-park-live-data (alerts), así que el
-- clima estuvo roto por meses sin señal observable — synced_at siempre se veía
-- fresco aunque sync-park-weather nunca escribiera nada. Cada fuente necesita
-- su propio timestamp para poder medir staleness por separado.
ALTER TABLE public.park_live_data
  ADD COLUMN weather_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN public.park_live_data.weather_synced_at IS
  'Última escritura exitosa de la columna weather por sync-park-weather (única función que la actualiza; cron diario 12:30 UTC). NULL o stale = el sync de clima está fallando — revisar sync_errors (step "weather") y los logs de la función.';

COMMENT ON COLUMN public.park_live_data.synced_at IS
  'Última corrida de sync-park-live-data (alerts/full). NO la actualiza sync-park-weather — para staleness del clima ver weather_synced_at.';
