import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gauge, Ticket, Footprints, Globe, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/editorial/Reveal";
import { products } from "@/config/pricing";

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

const SUPABASE_URL =
  "https://vrixiuvnhvqafmxlcyex.supabase.co/storage/v1/object/public/media_gallery";

const photos = [
  `${SUPABASE_URL}/00f4bec5-78fa-4416-91fd-12c8319e9d49.jpeg`,
  `${SUPABASE_URL}/0971bffa-5cc8-4d0e-8c81-27f6cd4aef7a.jpeg`,
  `${SUPABASE_URL}/2171f956-08ac-4156-9644-178aa01e241e.jpeg`,
  `${SUPABASE_URL}/349defac-d3ac-474c-a03a-ab262fb49b8f.jpeg`,
  `${SUPABASE_URL}/391bde98-0b99-4773-ad0d-f5c7e50107e4.jpeg`,
  `${SUPABASE_URL}/3a72e5c0-b2a1-485b-b3fb-bf958b815579.jpeg`,
  `${SUPABASE_URL}/3bd94287-e5c1-46f9-9e5c-1bad3b82068b.jpeg`,
  `${SUPABASE_URL}/3fdc4c24-45ab-42e8-abae-a45d4bff242a.jpeg`,
  `${SUPABASE_URL}/59e22d4c-75d0-4ab7-86b4-54774328a333.jpeg`,
  `${SUPABASE_URL}/78ca25d9-466c-4580-92ad-3d1f56d57ad2.jpeg`,
  `${SUPABASE_URL}/947b0c74-2096-46f5-b91b-62aa68f8142e.jpeg`,
  `${SUPABASE_URL}/b4a7fef0-0082-4e60-98cc-37cadf3ad004.jpeg`,
  `${SUPABASE_URL}/bfa161c7-c696-4d19-a1a9-4c8a8b31acc6.jpeg`,
  `${SUPABASE_URL}/c29ff6ac-f25b-4011-9ac7-1d31121e9e71.jpeg`,
  `${SUPABASE_URL}/feeb5de1-333e-48bc-9bbd-caff00902fcc.jpeg`,
];

const PremiumItinerarySection = () => {
  const [cardPhotos, setCardPhotos] = useState<string[]>(() =>
    shuffled(photos).slice(0, 4)
  );
  const [panelVisible, setPanelVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setPanelVisible(false);
      const tid = setTimeout(() => {
        setCardPhotos(shuffled(photos).slice(0, 4));
        setPanelVisible(true);
      }, 600);
      return () => clearTimeout(tid);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="section-editorial relative overflow-hidden bg-foreground section-recessed">
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
            <span className="text-xs tracking-[0.2em] uppercase font-medium block" style={{ color: "#FCD34D" }}>
              ✦ Diseño 100% Personalizado
            </span>
          </Reveal>

          {/* Heading */}
          <Reveal className="text-center mb-4">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-background leading-tight">
              Tu Aventura,{" "}
              <span style={{ color: "#FCD34D" }}>Tu Medida</span>
            </h2>
          </Reveal>

          <Reveal className="text-center text-background/70 text-lg max-w-[42rem] mx-auto mb-16 leading-relaxed">
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
                className="flex flex-row min-h-[160px] rounded-lg overflow-hidden bg-card"
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
                <Card className="relative flex flex-col h-full bg-white card-depth border-2 border-green">
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
                          <Check className="h-4 w-4 text-green flex-shrink-0 mt-0.5" />
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
                      className="w-full bg-green hover:bg-green-dark text-white"
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
