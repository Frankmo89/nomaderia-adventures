const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;

/**
 * Builds a WhatsApp `wa.me` URL with a pre-filled message.
 * Returns `undefined` when `VITE_WHATSAPP_NUMBER` is not configured.
 */
export const buildWhatsAppUrl = (message: string): string | undefined =>
  WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    : undefined;
