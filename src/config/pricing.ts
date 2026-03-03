export const WHATSAPP_NUMBER = "18588996802";

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
      "Itinerario día a día",
      "Lista de equipo con links",
      "Presupuesto desglosado",
      "Mapa interactivo",
    ],
    cta: "Pedir mi Weekend",
    message: "Hola Nomaderia, me interesa el paquete Weekend para un viaje de 1-3 días. ¿Cuáles son los siguientes pasos?",
  },
  {
    name: "Aventura",
    priceUsd: "$35 USD",
    priceMxn: "$549 MXN",
    duration: "4-7 días",
    popular: true,
    features: [
      "Todo de Weekend +",
      "Plan de preparación física (4-8 semanas)",
      "FAQ personalizado",
      "Tips de transporte",
      "Opciones de alojamiento comparadas",
    ],
    cta: "Pedir mi Aventura",
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
      "Todo de Aventura +",
      "Soporte por WhatsApp durante el viaje",
      "Itinerario alternativo (Plan B clima)",
      "Checklist pre-viaje completo",
    ],
    cta: "Pedir mi Expedición",
    message: "Hola Nomaderia, me interesa el paquete Expedición para un viaje de 8+ días. ¿Cuáles son los siguientes pasos?",
  },
];
