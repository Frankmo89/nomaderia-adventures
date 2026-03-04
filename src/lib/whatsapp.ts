const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;

/**
 * Builds a WhatsApp `wa.me` URL with a pre-filled message.
 * When `phoneNumber` is provided it is used directly; otherwise falls back
 * to `VITE_WHATSAPP_NUMBER` and returns `undefined` when neither is available.
 */
export function buildWhatsAppUrl(message: string, phoneNumber: string): string;
export function buildWhatsAppUrl(
  message: string,
  phoneNumber?: string,
): string | undefined;
export function buildWhatsAppUrl(
  message: string,
  phoneNumber?: string,
): string | undefined {
  const number = phoneNumber ?? WHATSAPP_NUMBER;
  return number
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : undefined;
}
