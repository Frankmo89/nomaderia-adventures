import { motion } from "framer-motion";
import { Map, Headphones, BadgeDollarSign, Zap, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const benefits = [
  {
    icon: Map,
    title: "Rutas Secretas",
    desc: "Caminos que no encuentras en Google ni en ninguna guía de turistas",
  },
  {
    icon: Headphones,
    title: "Soporte 24/7",
    desc: "Acompañamiento personalizado antes, durante y después de tu aventura",
  },
  {
    icon: BadgeDollarSign,
    title: "Optimización de Presupuesto",
    desc: "Máxima experiencia sin desperdiciar un peso en lo que no importa",
  },
  {
    icon: Zap,
    title: "Respuesta en 24h",
    desc: "Tu propuesta personalizada lista en menos de un día hábil",
  },
];

const packages = [
  {
    name: "Escapada",
    priceUsd: "$9",
    duration: "1-3 días",
    popular: false,
    features: [
      "Itinerario día a día",
      "Lista de equipo con links",
      "Presupuesto desglosado",
    ],
    cta: "Pedir Escapada →",
    message: "Hola Frank, me interesa el paquete Escapada para [destino]",
  },
  {
    name: "Aventura",
    priceUsd: "$25",
    duration: "4-7 días",
    popular: true,
    features: [
      "Todo de Escapada +",
      "Plan de preparación física",
      "Tips de transporte y alojamiento",
    ],
    cta: "Pedir Aventura →",
    message: "Hola Frank, me interesa el paquete Aventura para [destino]",
  },
  {
    name: "Expedición",
    priceUsd: "$49",
    duration: "8+ días",
    popular: false,
    features: [
      "Todo de Aventura +",
      "Soporte WhatsApp durante el viaje",
      "Itinerario alternativo (Plan B)",
    ],
    cta: "Pedir Expedición →",
    message: "Hola Frank, me interesa el paquete Expedición para [destino]",
  },
];

const PremiumItinerarySection = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 bg-secondary/5" />
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, hsl(var(--secondary) / 0.08) 0%, transparent 60%), radial-gradient(circle at 80% 20%, hsl(var(--trail) / 0.06) 0%, transparent 50%)" }} />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-transparent border border-secondary text-secondary text-sm font-medium tracking-wide">
              🏔️ Diseño 100% Personalizado
            </span>
          </div>

          {/* Heading */}
          <div className="text-center mb-4">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Tu Aventura,{" "}
              <span className="text-secondary">Tu Medida</span>
            </h2>
          </div>

          <p className="text-center text-gray-700 text-lg max-w-2xl mx-auto mb-16 leading-relaxed">
            Diseño tu itinerario de trekking desde cero, adaptado a tu cuerpo, presupuesto y sueños.
            Sin plantillas genéricas. Sin rutas de turista.
          </p>

          {/* Benefits grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex items-start gap-4 p-5 rounded-2xl bg-card/60 border border-secondary/15 hover:border-secondary/30 transition-colors"
              >
                <div className="shrink-0 p-2.5 rounded-xl bg-secondary/15">
                  <b.icon className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">{b.title}</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {packages.map((pkg, i) => {
              const url = buildWhatsAppUrl(pkg.message);
              return (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card
                  className={cn(
                    "relative flex flex-col h-full bg-white shadow-lg",
                    pkg.popular
                      ? "border-2 border-primary shadow-primary/10"
                      : "border-border"
                  )}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                        Más Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pt-7 pb-3">
                    <h3 className="font-serif text-xl text-foreground mb-1">
                      {pkg.name}
                    </h3>
                    <p className="text-2xl font-bold text-foreground">
                      {pkg.priceUsd} <span className="text-sm font-normal text-foreground/50">USD</span>
                    </p>
                    <p className="text-xs text-foreground/60 mt-1">
                      {pkg.duration}
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1 pt-0">
                    <ul className="space-y-2">
                      {pkg.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-foreground/70 text-sm">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {url ? (
                      <Button
                        asChild
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {pkg.cta}
                        </a>
                      </Button>
                    ) : (
                      <Button disabled className="w-full">
                        {pkg.cta}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
              );
            })}
          </div>

          {/* Link to full details */}
          <div className="text-center">
            <Link
              to="/servicios"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Ver todos los detalles →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PremiumItinerarySection;
