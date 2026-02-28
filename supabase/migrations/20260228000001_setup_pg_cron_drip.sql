-- Configurar cron job diario para enviar emails del drip sequence
-- Requiere que la extensión pg_cron esté habilitada en:
-- Dashboard > Database > Extensions > pg_cron
--
-- NOTA: current_setting('supabase.service_role_key') funciona en algunos entornos
-- Supabase pero no está garantizado. Si falla, usa cron-job.org (gratis):
-- 1. Crear cuenta en https://cron-job.org
-- 2. Añadir job: POST diario a las 10:00 AM CT (16:00 UTC)
--    URL: https://<TU_PROJECT_REF>.supabase.co/functions/v1/send-drip-emails
--    Header: Authorization: Bearer <service_role_key>  (obtener de Dashboard > Settings > API)
--    Body: {}
--
-- IMPORTANTE: para evitar hardcodear el host/proyecto, configura por entorno:
--   ALTER DATABASE CURRENT SET app.drip_function_url =
--     'https://<TU_PROJECT_REF>.supabase.co/functions/v1/send-drip-emails';
-- y luego ejecuta esta migración.

DO $$
DECLARE
  has_pg_cron boolean;
  has_pg_net  boolean;
BEGIN
  -- Verificar que las extensiones requeridas estén habilitadas
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
    RAISE NOTICE 'pg_cron o pg_net no están disponibles; se omite la configuración del cron job daily-drip-emails.';
    RETURN;
  END IF;

  BEGIN
    PERFORM cron.schedule(
      'daily-drip-emails',
      '0 16 * * *',  -- 16:00 UTC = 10:00 AM CT (hora Ciudad de México)
      $$
      SELECT net.http_post(
        url := 'https://vrixiuvnhvqafmxlcyex.supabase.co/functions/v1/send-drip-emails',
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
      RAISE NOTICE 'Funciones cron.schedule o net.http_post no están definidas; se omite la configuración del cron job daily-drip-emails.';
  END;
END;
$$;
