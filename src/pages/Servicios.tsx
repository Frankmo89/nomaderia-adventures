import { useEffect } from "react";
import { MessageCircle, Check, BadgeCheck, ClipboardList, Route, Palmtree } from "lucide-react";
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
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { packages, WHATSAPP_NUMBER } from "@/config/pricing";

const steps = [
  {
    icon: ClipboardList,
    title: "1. Cuéntanos tu plan",
    description:
      "Escríbenos por WhatsApp: ¿a dónde quieres ir? ¿cuántos van? ¿cuántos días? ¿cuál es tu presupuesto?",
  },
  {
    icon: Route,
    title: "2. Diseñamos tu ruta",
    description:
      "En 24-48 horas recibes tu itinerario personalizado con rutas, equipo, presupuesto y tips de preparación física.",
  },
  {
    icon: Palmtree,
    title: "3. Viaja sin estrés",
    description:
      "Llega a tu aventura preparado y seguro. Con Expedición, te acompañamos por WhatsApp durante todo el viaje.",
  },
];

const faqs = [
  {
    question: "¿Qué incluye exactamente un itinerario?",
    answer:
      "Cada itinerario incluye una ruta día a día con horarios sugeridos, lista de equipo con enlaces de compra, presupuesto desglosado, mapa interactivo y tips de preparación física adaptados a tu nivel.",
  },
  {
    question: "¿Qué tan personalizado es?",
    answer:
      "100%. No usamos plantillas. Cada itinerario se diseña desde cero basado en tu nivel de experiencia, presupuesto, fechas y grupo.",
  },
  {
    question: "¿Qué pasa si nunca he hecho hiking?",
    answer:
      "¡Perfecto! Nomaderia está diseñado para principiantes. Tu itinerario incluye preparación física progresiva y recomendaciones de equipo para tu nivel.",
  },
  {
    question: "¿Puedo pedir cambios al itinerario?",
    answer:
      "Sí, una ronda de ajustes está incluida en todos los paquetes. Queremos que tu plan quede perfecto.",
  },
];

const cardContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

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
          <Badge className="mb-6 bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/10">
            <BadgeCheck className="h-3.5 w-3.5 mr-1" />
            Agente de Viajes Certificado TAP
          </Badge>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
            Tu aventura, armada paso a paso
          </h1>
          <p className="text-lg md:text-xl text-foreground/70 leading-relaxed max-w-2xl mx-auto">
            ¿Primera vez en una aventura outdoor? No te preocupes. Te diseñamos
            un itinerario completo — ruta, equipo, presupuesto — adaptado a tu
            nivel y estilo.
          </p>
          <Button asChild size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground">
            <a
              href={buildWhatsAppUrl("¡Hola Nomaderia! Me interesa diseñar mi próxima aventura. ¿Cuáles son los siguientes pasos?", WHATSAPP_NUMBER)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Escríbenos por WhatsApp
            </a>
          </Button>
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
        <motion.div
          className="grid md:grid-cols-3 gap-8 items-start"
          variants={cardContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {packages.map((pkg) => {
            const url = buildWhatsAppUrl(pkg.message, WHATSAPP_NUMBER);
            return (
              <motion.div key={pkg.name} variants={cardItemVariants}>
                <Card
                  className={cn(
                    "relative flex flex-col h-full bg-card shadow-lg",
                    pkg.popular
                      ? "border-2 border-primary shadow-primary/10 md:scale-105"
                      : "border-border"
                  )}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                        Más popular
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
                    {pkg.highlight && (
                      <p className="text-xs font-medium text-primary mt-2">
                        ✦ {pkg.highlight}
                      </p>
                    )}
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
                      className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        {pkg.cta}
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
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
