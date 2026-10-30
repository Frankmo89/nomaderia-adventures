export const WHATSAPP_NUMBER = "18588996802";

export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * WhatsApp with `message` ready for any chat the visitor picks (family,
 * friends). Unlike buildWhatsAppLink, it does not go to Nomaderia's number.
 */
export function buildWhatsAppShareLink(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
