export { WHATSAPP_NUMBER } from "@/lib/whatsapp";

export interface Package {
  name: string;
  priceUsd: string;
  priceMxn: string;
  duration: string;
  popular: boolean;
  highlight?: string;
  features: string[];
  cta: string;
  message: string;
}

export const packages: Package[] = [
  {
    name: "Weekend",
    priceUsd: "$19 USD",
    priceMxn: "$299 MXN",
    duration: "1-3 días",
    popular: false,
    features: [
      "Diseño de ruta 100% personalizada",
      "Guía de equipo técnico optimizado",
      "Presupuesto estratégico detallado",
      "Mapa interactivo offline",
    ],
    cta: "Planificar mi Weekend",
    message: "Hola Nomaderia, me interesa el paquete Weekend para un viaje de 1-3 días. ¿Cuáles son los siguientes pasos?",
  },
  {
    name: "Aventura",
    priceUsd: "$35 USD",
    priceMxn: "$549 MXN",
    duration: "4-7 días",
    popular: true,
    features: [
      "Todo lo del plan Weekend +",
      "Plan de acondicionamiento físico",
      "Comparativa de alojamientos seguros",
      "Logística de transportes locales",
      "Soporte de dudas pre-viaje",
    ],
    cta: "Diseñar mi Aventura",
    message: "Hola Nomaderia, me interesa el paquete Aventura para un viaje de 4-7 días. ¿Cuáles son los siguientes pasos?",
  },
  {
    name: "Expedición",
    priceUsd: "$59 USD",
    priceMxn: "$899 MXN",
    duration: "8+ días",
    popular: false,
    highlight: "Soporte por WhatsApp durante el viaje",
    features: [
      "Todo lo del plan Aventura +",
      "Acompañamiento 24/7 en ruta (WhatsApp)",
      "Plan B garantizado (Ruta alternativa por clima)",
      "Checklist de seguridad premium",
    ],
    cta: "Crear mi Expedición",
    message: "Hola Nomaderia, me interesa el paquete Expedición para un viaje de 8+ días. ¿Cuáles son los siguientes pasos?",
  },
];
