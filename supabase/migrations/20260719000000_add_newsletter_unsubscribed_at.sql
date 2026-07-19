-- Baja de newsletter (CAN-SPAM): NULL = suscrito activo; timestamp = fecha de baja.
-- La escriben solo las edge functions con service role (la función pública
-- `unsubscribe` valida un token HMAC antes de marcar). Sin cambios de RLS:
-- la tabla ya es INSERT público / SELECT solo admin, y service role la ignora.
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN unsubscribed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.newsletter_subscribers.unsubscribed_at IS
  'Fecha de baja del drip/newsletter. NULL = activo. Marcada por la edge function unsubscribe (token HMAC firmado con CRON_SECRET).';
