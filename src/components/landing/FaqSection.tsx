import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Section from "@/components/editorial/Section";
import Eyebrow from "@/components/editorial/Eyebrow";
import Reveal from "@/components/editorial/Reveal";
import JsonLd from "@/components/JsonLd";

interface FaqItem {
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: "¿Por qué pagar $49 si hay apps gratis como AllTrails?",
    answer:
      "AllTrails te da un mapa. Nosotros te damos un plan completo pensado para principiantes: qué permiso necesitas, cómo llegar, qué llevar, y un itinerario día por día — todo en español, hecho por una persona real, no un algoritmo genérico.",
  },
  {
    question: "¿Qué incluye exactamente el Itinerario Completo?",
    answer:
      "Ruta día por día según tu nivel y fechas, permisos y reservas explicados, lista de equipo específica para el parque, y soporte por WhatsApp durante tu viaje.",
  },
  {
    question: "¿Cómo funciona el pago?",
    answer:
      "Todo empieza por WhatsApp: nos cuentas tu viaje, te confirmamos el precio ($49 USD) y coordinamos el pago antes de entregarte tu itinerario en 24-48 horas.",
  },
  {
    question: "Nunca he hecho senderismo, ¿es para mí?",
    answer:
      "Sí — Nomaderia está diseñado específicamente para quien nunca ha ido a un parque nacional. Te explicamos todo desde cero, sin asumir que ya sabes lo básico.",
  },
  {
    question: "¿Qué pasa si cambio de fecha o de parque?",
    answer:
      "Sin problema, escríbenos por WhatsApp y ajustamos tu itinerario contigo.",
  },
];

const FaqSection = () => {
  const faqJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    }),
    []
  );

  return (
    <Section className="relative overflow-hidden bg-cloud py-16 sm:py-24">
      <JsonLd data={faqJsonLd} />
      <div className="mx-auto max-w-2xl">
        <Reveal className="mb-10 text-center sm:mb-14">
          <Eyebrow as="p" className="mb-3 block">
            Preguntas frecuentes
          </Eyebrow>
          <h2 className="font-serif text-3xl font-bold leading-tight text-ink sm:text-4xl md:text-5xl">
            Antes de escribirnos, resolvamos tus dudas
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={item.question}
                value={`item-${index}`}
                className="border-b border-stone"
              >
                <AccordionTrigger className="py-5 text-left font-sans text-base font-semibold text-ink hover:no-underline sm:text-lg">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="font-sans text-sm leading-relaxed text-slate sm:text-base">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </Section>
  );
};

export default FaqSection;
