export { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { buildWhatsAppUrl, WHATSAPP_NUMBER } from "@/lib/whatsapp";

export interface Product {
  id: "permit_alert" | "itinerary" | "bundle";
  name: string;
  price: string;
  type: "one-time" | "bundle";
  description: string;
  features: string[];
  cta: string;
  ctaUrl: string;
  label?: string;
  popular?: boolean;
}

const STRIPE_SENTINEL_URL =
  import.meta.env.VITE_STRIPE_SENTINEL_URL ||
  "https://buy.stripe.com/00w9AT9bA2fR8I4bayaAw00";

export const products: Product[] = [
  {
    id: "permit_alert",
    name: "Alerta de Permisos",
    price: "$29 USD",
    type: "one-time",
    description: "Te avisamos cuando se libere tu cupo en el parque",
    features: [
      "Monitoreo 24/7",
      "Aviso por WhatsApp",
      "Yosemite y más parques",
    ],
    cta: "Quiero mi alerta",
    ctaUrl: STRIPE_SENTINEL_URL,
  },
  {
    id: "itinerary",
    name: "Itinerario Personalizado",
    price: "$29 USD",
    type: "one-time",
    description: "Tu plan día a día según tu nivel, revisado por agente TAP",
    features: [
      "Personalizado por nivel",
      "Revisado por agente TAP certificado",
      "Incluye gear y preparación física",
    ],
    cta: "Quiero mi itinerario",
    ctaUrl: buildWhatsAppUrl("Hola, quiero mi itinerario personalizado", WHATSAPP_NUMBER),
    popular: true,
  },
  {
    id: "bundle",
    name: "Solución Completa",
    price: "$49 USD",
    type: "bundle",
    label: "Ahorra $9",
    description: "Alerta de permisos + itinerario personalizado",
    features: [
      "Monitoreo 24/7",
      "Aviso por WhatsApp",
      "Yosemite y más parques",
      "Personalizado por nivel",
      "Revisado por agente TAP certificado",
      "Incluye gear y preparación física",
    ],
    cta: "Quiero los dos",
    ctaUrl: buildWhatsAppUrl("Hola, quiero la Solución Completa (alerta + itinerario)", WHATSAPP_NUMBER),
  },
];
