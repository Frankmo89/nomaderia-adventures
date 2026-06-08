import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gauge, Ticket, Footprints, Globe, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/editorial/Reveal";
import { products } from "@/config/pricing";
import { supabase } from "@/integrations/supabase/client";

const benefits = [
  {
    icon: Gauge,
    title: "Dificultad Honesta",
    desc: "Te decimos exactamente qué forma física necesitas. Sin subestimar el reto ni exagerarlo para venderte el servicio.",
  },
  {
    icon: Ticket,
    title: "Permisos Sin Estrés",
    desc: "Te guiamos paso a paso en Recreation.gov antes de que se agoten los cupos — Yosemite, Half Dome y más.",
  },
  {
    icon: Footprints,
    title: "Hecho para Principiantes",
    desc: "Nunca asumimos que ya sabes. Cada guía parte de cero, sin jerga de mochilero experto.",
  },
  {
    icon: Globe,
    title: "En Español de Verdad",
    desc: "No es traducción automática. Explicamos permisos, trails y tarifas con los términos reales de los parques.",
  },
];

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PremiumItinerarySection = () => {
  const [photoPool, setPhotoPool] = useState<string[]>([]);
  const [cardPhotos, setCardPhotos] = useState<string[]>(["", "", "", ""]);
  const [panelVisible, setPanelVisible] = useState(true);

  useEffect(() => {
    supabase.storage
      .from("destinations")
      .list("", { limit: 20 })
      .then(({ data }) => {
        if (!data) return;
        const urls = data
          .filter(
            (f) =>
              f.id !== null && /\.(jpe?g|png|webp|avif)$/i.test(f.name)
          )
          .map(
            (f) =>
              supabase.storage.from("destinations").getPublicUrl(f.name).data
                .publicUrl
          );
        if (urls.length >= 4) {
          setPhotoPool(urls);
          setCardPhotos(shuffled(urls).slice(0, 4));
        }
      });
  }, []);

  useEffect(() => {
    if (photoPool.length < 4) return;
    const id = setInterval(() => {
      setPanelVisible(false);
      const tid = setTimeout(() => {
        setCardPhotos(shuffled(photoPool).slice(0, 4));
        setPanelVisible(true);
      }, 600);
      return () => clearTimeout(tid);
    }, 4000);
    return () => clearInterval(id);
  }, [photoPool]);

  return (
    <section className="section-editorial relative overflow-hidden bg-wash-clay section-recessed">
      {/* Background texture */}
      <div className="absolute inset-0 bg-secondary/5" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, hsl(var(--secondary) / 0.08) 0%, transparent 60%), radial-gradient(circle at 80% 20%, hsl(var(--trail) / 0.06) 0%, transparent 50%)",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <Reveal className="text-center mb-6">
            <span className="text-xs tracking-[0.2em] uppercase font-medium text-secondary block">
              ✦ Diseño 100% Personalizado
            </span>
          </Reveal>

          {/* Heading */}
          <Reveal className="text-center mb-4">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Tu Aventura,{" "}
              <span className="text-secondary">Tu Medida</span>
            </h2>
          </Reveal>

          <Reveal className="text-center text-foreground/70 text-lg max-w-[42rem] mx-auto mb-16 leading-relaxed">
            Diseñamos tu itinerario de trekking desde cero, adaptado a tu nivel, presupuesto y objetivos.
            Sin plantillas genéricas. Sin rutas de turista.
          </Reveal>

          {/* Benefits grid — 2×2 Fiverr Pro style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-row min-h-[160px] rounded-lg overflow-hidden bg-card/60"
                style={{ border: "0.5px solid rgba(22, 101, 52, 0.2)" }}
              >
                {/* Left: icon + text */}
                <div className="flex-1 p-5 flex flex-col justify-center gap-2">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#FEF3C7" }}
                  >
                    <b.icon className="h-5 w-5" style={{ color: "#D97706" }} />
                  </div>
                  <p className="font-serif font-semibold text-foreground text-base leading-snug">
                    {b.title}
                  </p>
                  <p className="font-sans text-sm text-foreground/75 leading-relaxed">
                    {b.desc}
                  </p>
                </div>

                {/* Right: rotating photo panel */}
                <div
                  className="shrink-0 bg-accent"
                  style={{
                    width: 130,
                    backgroundImage: cardPhotos[i]
                      ? `url(${cardPhotos[i]})`
                      : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: panelVisible ? 1 : 0,
                    transition: "opacity 0.6s ease",
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Single CTA */}
          <div className="text-center mb-14">
            <Button
              asChild
              className="text-white px-8 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#D97706" }}
            >
              <Link to="/servicios">Ver qué incluye el servicio →</Link>
            </Button>
          </div>

          {/* Pricing card — unchanged */}
          <div className="max-w-lg mx-auto mb-8">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="relative flex flex-col h-full bg-white card-depth border-2 border-primary">
                  <CardHeader className="text-center pt-7 pb-3">
                    <h3 className="font-serif text-xl text-foreground mb-1">
                      {product.name}
                    </h3>
                    <p className="text-2xl font-bold text-foreground">
                      ${product.priceUSD} {product.currency}
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1 pt-0">
                    <ul className="space-y-2">
                      {product.features.map((feature) => (
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
                    <Button
                      asChild
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <a
                        href={product.ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Diseña mi aventura por WhatsApp
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PremiumItinerarySection;
