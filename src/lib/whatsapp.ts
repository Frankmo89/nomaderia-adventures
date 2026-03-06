export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "18588996802";

/**
 * Builds a WhatsApp `wa.me` URL with a pre-filled message.
 * When `phoneNumber` is provided it is used directly; otherwise falls back
 * to `VITE_WHATSAPP_NUMBER` (which itself falls back to the hardcoded default).
 */
export function buildWhatsAppUrl(message: string, phoneNumber?: string): string {
  const number = phoneNumber ?? WHATSAPP_NUMBER;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
