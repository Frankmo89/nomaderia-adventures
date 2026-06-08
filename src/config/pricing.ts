export { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export interface Product {
  id: string;
  name: string;
  priceUSD: number;
  currency: "USD";
  ctaType: "whatsapp" | "stripe";
  features: string[];
  ctaUrl: string;
}

export const PRICING = {
  solucionCompleta: 49,
} as const;

// TODO: Frank — pega aquí el nuevo Payment Link desde Stripe Dashboard
export const STRIPE_LINK_ITINERARIO_49 = "REEMPLAZAR_CON_LINK_DE_49_USD";

export const products: Product[] = [
  {
    id: "itinerario-completo",
    name: "Itinerario Completo Nomaderia",
    priceUSD: PRICING.solucionCompleta,
    currency: "USD",
    ctaType: "whatsapp",
    features: [
      "Itinerario día por día (ruta, tiempos y dificultad honesta para principiantes)",
      "Permisos: qué necesitas, cuándo abre la lotería y cómo aplicar",
      "Lista de equipo con enlaces recomendados",
      "Dónde dormir y acampar",
      "Tours y experiencias seleccionadas",
      "Soporte por WhatsApp durante tu viaje",
    ],
    ctaUrl: buildWhatsAppLink(
      `Hola Nomaderia 👋 Quiero contratar el Itinerario Completo ($${PRICING.solucionCompleta} USD).`
    ),
  },
];
