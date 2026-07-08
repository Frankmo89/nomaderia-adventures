-- Configurar cron job semanal para sync-park-trails
-- Requiere que pg_cron y pg_net estén habilitados en:
-- Dashboard > Database > Extensions
--
-- NOTA: current_setting('supabase.service_role_key') funciona en algunos
-- entornos Supabase pero no está garantizado (mismo caveat que
-- 20260228000001_setup_pg_cron_drip.sql). Si falla, usar cron-job.org:
-- 1. Crear cuenta en https://cron-job.org
-- 2. Añadir job: POST semanal a las 08:00 UTC lunes
--    URL: https://<TU_PROJECT_REF>.supabase.co/functions/v1/sync-park-trails
--    Header: Authorization: Bearer <service_role_key>  (Dashboard > Settings > API)
--    Body: {}
--
-- sync-park-trails procesa como máximo 5 parques por invocación (límite del
-- tier gratuito de Supabase), priorizando los menos recientemente
-- sincronizados. Con cadencia semanal, los 63 parques quedan cubiertos en
-- rotación a lo largo de ~13 semanas; después el ciclo se repite.

DO $outer$
DECLARE
  has_pg_cron boolean;
  has_pg_net  boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'pg_cron'
  ) INTO has_pg_cron;

  SELECT EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'pg_net'
  ) INTO has_pg_net;

  IF NOT (has_pg_cron AND has_pg_net) THEN
    RAISE NOTICE 'pg_cron o pg_net no están disponibles; se omite la configuración del cron job weekly-sync-park-trails.';
    RETURN;
  END IF;

  BEGIN
    PERFORM cron.schedule(
      'weekly-sync-park-trails',
      '0 8 * * 1',  -- Lunes 08:00 UTC
      $$
      SELECT net.http_post(
        url := 'https://vrixiuvnhvqafmxlcyex.supabase.co/functions/v1/sync-park-trails',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('supabase.service_role_key'),
          'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
      );
      $$
    );
  EXCEPTION
    WHEN undefined_function THEN
      RAISE NOTICE 'Funciones cron.schedule o net.http_post no están definidas; se omite la configuración del cron job weekly-sync-park-trails.';
  END;
END;
$outer$;
