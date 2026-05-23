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
    name: "Alerta de Permisos",
    priceUsd: "$29 USD",
    priceMxn: "Pago único",
    duration: "Te avisamos cuando se libere tu cupo en Yosemite",
    popular: false,
    features: [
      "Monitoreo de disponibilidad en tiempo real",
      "Notificación inmediata por WhatsApp",
      "Guía rápida para completar tu reserva",
    ],
    cta: "Quiero mi alerta de permisos",
    message: "Hola Nomaderia, me interesa la Alerta de Permisos de $29 USD. ¿Cuáles son los siguientes pasos?",
  },
  {
    name: "Itinerario Personalizado",
    priceUsd: "$29 USD",
    priceMxn: "Pago único",
    duration: "Tu plan día a día revisado por agente TAP certificado",
    popular: true,
    features: [
      "Ruta diaria adaptada a tu nivel",
      "Checklist de equipo recomendado",
      "Presupuesto estimado por categoría",
    ],
    cta: "Quiero mi itinerario personalizado",
    message: "Hola Nomaderia, me interesa el Itinerario Personalizado de $29 USD. ¿Cuáles son los siguientes pasos?",
  },
  {
    name: "Bundle",
    priceUsd: "$49 USD",
    priceMxn: "Pago único",
    duration: "Alerta de Permisos + Itinerario Personalizado",
    popular: false,
    highlight: "Solución Completa",
    features: [
      "Incluye ambos servicios con descuento",
      "Seguimiento para reservar tu cupo",
      "Plan día a día listo para viajar",
    ],
    cta: "Quiero la solución completa",
    message: "Hola Nomaderia, me interesa el Bundle de $49 USD con ambos servicios. ¿Cuáles son los siguientes pasos?",
  },
];
