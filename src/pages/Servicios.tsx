import { useEffect } from "react";
import { MessageCircle, Map, Smile, Check, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useCanonical } from "@/hooks/use-seo";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER;

const buildWhatsAppUrl = (message: string) =>
  whatsappNumber
    ? `https://wa.me/${encodeURIComponent(whatsappNumber)}?text=${encodeURIComponent(message)}`
    : undefined;

const steps = [
  {
    icon: MessageCircle,
    title: "Cuéntame tu sueño",
    description:
      "Mándame un WhatsApp y platícame: ¿a dónde quieres ir? ¿cuántos van? ¿cuál es tu presupuesto?",
  },
  {
    icon: Map,
    title: "Te armo todo",
    description:
      "En 24-48 horas recibes tu itinerario personalizado con rutas, equipo, presupuesto y tips de preparación física.",
  },
  {
    icon: Smile,
    title: "Solo disfruta",
    description:
      "Llega a tu aventura preparado y sin estrés. Con Expedición, te acompaño por WhatsApp durante todo el viaje.",
  },
];

const packages = [
  {
    name: "Escapada",
    priceUsd: "$9 USD",
    priceMxn: "$149 MXN",
    duration: "Viajes de 1-3 días",
    popular: false,
    features: [
      "Itinerario día a día",
      "Lista de equipo con links",
      "Presupuesto desglosado",
      "Mapa interactivo",
    ],
    cta: "Pedir mi Escapada →",
    message: "Hola Frank, me interesa el paquete Escapada para [destino]",
  },
  {
    name: "Aventura",
    priceUsd: "$25 USD",
    priceMxn: "$449 MXN",
    duration: "Viajes de 4-7 días",
    popular: true,
    features: [
      "Todo de Escapada +",
      "Plan de preparación física (4-8 semanas)",
      "FAQ personalizado",
      "Tips de transporte",
      "Opciones de alojamiento comparadas",
    ],
    cta: "Pedir mi Aventura →",
    message: "Hola Frank, me interesa el paquete Aventura para [destino]",
  },
  {
    name: "Expedición",
    priceUsd: "$49 USD",
    priceMxn: "$849 MXN",
    duration: "Viajes de 8+ días",
    popular: false,
    features: [
      "Todo de Aventura +",
      "Soporte WhatsApp durante el viaje",
      "Itinerario alternativo (Plan B clima)",
      "Checklist pre-viaje completo",
    ],
    cta: "Pedir mi Expedición →",
    message: "Hola Frank, me interesa el paquete Expedición para [destino]",
  },
];

const faqs = [
  {
    question: "¿Qué tan personalizado es el itinerario?",
    answer:
      "100%. No uso plantillas. Cada itinerario se diseña desde cero basado en tu nivel de experiencia, presupuesto, fechas y grupo.",
  },
  {
    question: "¿En cuánto tiempo recibo mi itinerario?",
    answer: "24-48 horas después de confirmar tu pago.",
  },
  {
    question: "¿Cómo pago?",
    answer:
      "PayPal (USD) o transferencia bancaria SPEI (MXN). Te envío las instrucciones por WhatsApp.",
  },
  {
    question: "¿Qué pasa si nunca he hecho hiking?",
    answer:
      "¡Perfecto! Nomaderia está diseñado para principiantes. Tu itinerario incluye preparación física progresiva y recomendaciones de equipo para tu nivel.",
  },
  {
    question: "¿Puedo pedir cambios al itinerario?",
    answer:
      "Sí, una ronda de ajustes está incluida en todos los paquetes.",
  },
];

const Servicios = () => {
  useCanonical();

  useEffect(() => {
    document.title = "Servicios — Nomaderia";
    return () => {
      document.title = "Nomaderia — Tu Primera Aventura Te Está Esperando";
    };
  }, []);

  return (
    <main className="bg-background min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-4 pt-28 pb-16 max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            <BadgeCheck className="h-3.5 w-3.5 mr-1" />
            Agente de Viajes Certificado TAP
          </Badge>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
            Tu Concierge de Aventuras en Español
          </h1>
          <p className="text-lg md:text-xl text-foreground/70 leading-relaxed max-w-2xl mx-auto">
            Te armo tu viaje completo — itinerario, equipo, presupuesto —
            adaptado a ti.
          </p>
        </motion.div>
      </section>

      {/* Cómo Funciona */}
      <section className="container mx-auto px-4 pb-20 max-w-5xl">
        <motion.h2
          className="font-serif text-3xl md:text-4xl text-foreground text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Cómo Funciona
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-serif text-xl text-foreground">
                {step.title}
              </h3>
              <p className="text-foreground/70 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Paquetes */}
      <section className="container mx-auto px-4 pb-20 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <Card
                className={cn(
                  "relative flex flex-col h-full",
                  pkg.popular
                    ? "border-secondary shadow-lg shadow-secondary/10 md:scale-105"
                    : "border-border"
                )}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary">
                      Más Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <h3 className="font-serif text-2xl text-foreground mb-2">
                    {pkg.name}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-foreground">
                      {pkg.priceUsd}
                    </p>
                    <p className="text-sm text-foreground/50">{pkg.priceMxn}</p>
                  </div>
                  <p className="text-sm text-foreground/70 mt-2">
                    {pkg.duration}
                  </p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground/70 text-sm">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    className={cn(
                      "w-full h-12 text-base",
                      pkg.popular
                        ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    )}
                  >
                    <a
                      href={buildWhatsAppUrl(pkg.message)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {pkg.cta}
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 pb-20 max-w-3xl">
        <motion.h2
          className="font-serif text-3xl md:text-4xl text-foreground text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Preguntas Frecuentes
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/70">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
};

export default Servicios;
