import { MessageCircle, Check, BadgeCheck, ClipboardList, Route, Palmtree } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useCanonical, usePageMeta, SITE_URL } from "@/hooks/use-seo";
import { useMediaSlider } from "@/hooks/use-media";
import BackgroundSlideshow from "@/components/shared/BackgroundSlideshow";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { products, PRICING } from "@/config/pricing";
import JsonLd from "@/components/JsonLd";

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
      "Llega a tu aventura preparado y seguro. Te acompañamos por WhatsApp durante todo el recorrido.",
  },
];

const whatYouGet = [
  {
    title: "Tu itinerario día a día en PDF",
    description:
      "Horarios sugeridos, qué ver, cuánto caminas y qué tan difícil es de verdad. Si un sendero es duro para principiantes, te lo decimos sin adornos.",
  },
  {
    title: "Rutas listas en Google Maps",
    description:
      'Un enlace por cada día. Lo abres, presionas "Iniciar" y listo. No necesitas apps raras ni saber leer mapas.',
  },
  {
    title: "Plan B para cada día",
    description:
      "¿Amaneciste cansado? ¿Cambió el clima? Cada día incluye una alternativa más corta o más fácil.",
  },
  {
    title: "Permisos y reservas resueltos",
    description:
      "Qué permiso necesitas, cuándo abre la lotería y el enlace directo para aplicar. Nada de descubrirlo en la entrada del parque.",
  },
  {
    title: "Logística del camino",
    description:
      "Dónde cargar gasolina, dónde comer y dónde parar en el trayecto desde tu ciudad hasta el parque.",
  },
  {
    title: "Checklist de equipo para tu nivel",
    description:
      "Solo lo que sí vas a usar, con enlaces de compra. Nada de listas de 50 cosas.",
  },
  {
    title: "Presupuesto desglosado",
    description:
      "Entradas, gasolina, comida, hospedaje. Sabes cuánto vas a gastar antes de salir.",
  },
  {
    title: "Soporte por WhatsApp durante tu viaje",
    description: "Si algo cambia en el camino, nos escribes y lo resolvemos juntos.",
  },
];

const faqs = [
  {
    question: "¿Qué incluye exactamente un itinerario?",
    answer:
      "Recibes tu itinerario día a día en PDF, enlaces listos en Google Maps para cada ruta, un plan B diario por si cambia el clima o te cansas, los permisos y reservas que necesitas, la logística del trayecto (gasolina, comida, paradas), un checklist de equipo para tu nivel, tu presupuesto desglosado y soporte por WhatsApp durante todo tu viaje.",
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
  usePageMeta({
    title: `Servicios — Itinerario Completo $${PRICING.itinerarioCompleto} USD | Nomaderia`,
    description: `Itinerario completo personalizado a $${PRICING.itinerarioCompleto} USD: ruta día a día, permisos, equipo, alojamiento y soporte por WhatsApp. Para hispanos en EE. UU.`,
  });
  const { data: mediaItems } = useMediaSlider();

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Travel Planning",
    provider: {
      "@type": "TravelAgency",
      name: "Nomaderia Adventures",
      url: SITE_URL,
    },
    areaServed: { "@type": "Country", name: "United States" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios de Aventura",
      itemListElement: products.map((p) => ({
        "@type": "Offer",
        name: p.name,
        price: String(p.priceUSD),
        priceCurrency: "USD",
        url: `${SITE_URL}/servicios`,
      })),
    },
    inLanguage: "es",
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <JsonLd data={serviceLd} />
      <JsonLd data={faqLd} />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 min-h-[60vh] flex flex-col justify-center bg-zinc-900">
        <BackgroundSlideshow items={mediaItems ?? []} overlayClassName="bg-black/60" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/10">
              <BadgeCheck className="h-3.5 w-3.5 mr-1" />
              Agente de Viajes Certificado TAP
            </Badge>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6">
              Tu aventura, armada paso a paso
            </h1>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
              ¿Primera vez en una aventura outdoor? No te preocupes. Te diseñamos
              un itinerario completo — ruta, equipo, presupuesto — adaptado a tu
              nivel y estilo.
            </p>
            <Button asChild size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground">
              <a
                href={buildWhatsAppLink("Hola Nomaderia 👋 Tengo una pregunta sobre mis próximas aventuras.")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("cta_itinerario_whatsapp_click", { source: "servicios_hero" })}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Escríbenos por WhatsApp
              </a>
            </Button>
          </motion.div>
        </div>
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

      {/* Esto es exactamente lo que recibes */}
      <section className="container mx-auto px-4 pb-20 max-w-5xl">
        <motion.h2
          className="font-serif text-3xl md:text-4xl text-foreground text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Esto es exactamente lo que recibes
        </motion.h2>
        <motion.div
          className="grid gap-8 md:grid-cols-2"
          variants={cardContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {whatYouGet.map((item) => (
            <motion.div
              key={item.title}
              variants={cardItemVariants}
              className="flex items-start gap-4"
            >
              <Check className="h-6 w-6 text-green flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-foreground/70 leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Producto */}
      <section className="container mx-auto px-4 pb-20 max-w-lg">
        <motion.div
          variants={cardContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={cardItemVariants}>
              <Card className="relative flex flex-col h-full bg-card shadow-lg border-2 border-green shadow-green/10">
                <CardHeader className="text-center pt-8">
                  <h3 className="font-serif text-2xl text-foreground mb-2">
                    {product.name}
                  </h3>
                  <p className="text-3xl font-bold text-foreground">
                    ${product.priceUSD} {product.currency}
                  </p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green flex-shrink-0 mt-0.5" />
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
                    className="w-full h-12 text-base bg-green hover:bg-green-dark text-white"
                  >
                    <a
                      href={product.ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackEvent("cta_itinerario_whatsapp_click", { source: `servicios_${product.id}` })
                      }
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Diseña mi aventura por WhatsApp
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
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
