import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const didYouKnowText: Record<string, string> = {
  "ushuaia-fin-del-mundo": "¿Sabías que puedes caminar hasta un glaciar en el fin del mundo?",
  "gran-canon": "¿Sabías que puedes descender al fondo del Gran Cañón y acampar bajo las estrellas?",
  "everest-base-camp": "¿Sabías que puedes llegar al campamento base del Everest sin ser alpinista profesional?",
  "camino-de-santiago": "¿Sabías que puedes caminar 800 km a través de España y cambiar tu vida?",
  "nevado-de-toluca": "¿Sabías que puedes ver un lago dentro de un volcán a 4 horas de la CDMX?",
  "yosemite-valley": "¿Sabías que puedes despertar frente a cascadas de 700 metros en California?",
  "joshua-tree": "¿Sabías que puedes acampar entre árboles de otro planeta a 2 horas de LA?",
  "torres-del-paine": "¿Sabías que puedes recorrer uno de los trekkings más épicos del planeta en la Patagonia?",
  "sierra-san-pedro-martir": "¿Sabías que puedes ver las estrellas más brillantes de México en Baja California?",
};

const getDidYouKnowText = (slug: string, title: string) => {
  return didYouKnowText[slug] || `¿Sabías que puedes explorar ${title}?`;
};

const difficultyLabel: Record<string, string> = { easy: "Fácil", moderate: "Moderado", challenging: "Desafiante" };
const difficultyColor: Record<string, string> = { easy: "bg-secondary/80", moderate: "bg-primary/80", challenging: "bg-destructive/80" };

type Destination = {
  title: string;
  slug: string;
  country: string;
  hero_image_url: string | null;
  short_description: string | null;
  difficulty_level: string;
  estimated_budget_usd: number | null;
  days_needed: number | null;
};

const CardContent = ({ dest, isLarge = false }: { dest: Destination; isLarge?: boolean }) => (
  <Link
    to={`/destinos/${dest.slug}`}
    className="block relative rounded-2xl overflow-hidden group h-full"
  >
    {dest.hero_image_url ? (
      <img
        src={dest.hero_image_url}
        alt={dest.title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
    ) : (
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-primary/20" />
    )}

    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

    <div className="absolute top-4 left-4 z-10">
      <span className={`text-xs font-semibold text-white px-2.5 py-1 rounded-full ${difficultyColor[dest.difficulty_level] || "bg-primary/80"}`}>
        {difficultyLabel[dest.difficulty_level] || dest.difficulty_level}
      </span>
    </div>

    <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6 transition-transform duration-500 group-hover:translate-y-[-4px]">
      <p
        className={`font-serif font-bold text-white leading-tight mb-2 ${isLarge ? "text-xl sm:text-2xl md:text-3xl" : "text-base sm:text-lg"}`}
        style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
      >
        {getDidYouKnowText(dest.slug, dest.title)}
      </p>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span
          className="text-white/70 text-xs"
          aria-label={`Ubicación: ${dest.country}`}
        >
          <span aria-hidden="true">📍</span> {dest.country}
        </span>
        {dest.days_needed && (
          <span
            className="text-white/70 text-xs"
            aria-label={`Duración: ${dest.days_needed} días`}
          >
            · <span aria-hidden="true">⏱️</span> {dest.days_needed} días
          </span>
        )}
        {dest.estimated_budget_usd && (
          <span
            className="text-white/70 text-xs"
            aria-label={`Presupuesto estimado: ${dest.estimated_budget_usd} dólares estadounidenses`}
          >
            · <span aria-hidden="true">💰</span> ~${dest.estimated_budget_usd} USD
          </span>
        )}
      </div>

      <span className="inline-flex items-center text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors">
        Explorar destino
        <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </div>
  </Link>
);

const DidYouKnowSection = () => {
  const { data: destinations = [], isLoading } = useQuery({
    queryKey: ["didyouknow-destinations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("destinations")
        .select("title, slug, country, hero_image_url, short_description, difficulty_level, estimated_budget_usd, days_needed")
        .eq("is_published", true)
        .order("featured", { ascending: false })
        .limit(5);
      return (data || []) as Destination[];
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const scrollLeft = el.scrollLeft;
      const cardWidth = el.firstElementChild?.clientWidth || 1;
      setActiveIndex(Math.round(scrollLeft / (cardWidth + 16)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (isLoading || destinations.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-muted relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10">
        {/* Header */}
        <div className="container mx-auto px-5 mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-3 block">
              Aventuras reales para principiantes
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              ¿Sabías que puedes…?
            </h2>
          </motion.div>
        </div>

        {/* Mobile: cinematographic horizontal scroll */}
        <div
          ref={scrollRef}
          className="flex lg:hidden gap-4 overflow-x-auto snap-x snap-mandatory px-5 pb-4 scrollbar-hide"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {destinations.map((dest) => (
            <div
              key={dest.slug}
              className="snap-center shrink-0"
              style={{ width: "85vw", height: "420px" }}
            >
              <CardContent dest={dest} isLarge />
            </div>
          ))}
        </div>

        {/* Mobile scroll indicators */}
        <div className="flex lg:hidden justify-center gap-2 mt-5">
          {destinations.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-8 bg-primary" : "w-2 bg-foreground/20"
              }`}
            />
          ))}
        </div>

        {/* Desktop: Bento grid */}
        <div className="container mx-auto px-5">
          <div className="hidden lg:grid lg:grid-cols-3 lg:grid-rows-2 gap-4" style={{ minHeight: "600px" }}>
            {destinations[0] && (
              <motion.div
                className="col-span-1 row-span-2"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <CardContent dest={destinations[0]} isLarge />
              </motion.div>
            )}

            {destinations.slice(1, 5).map((dest, i) => (
              <motion.div
                key={dest.slug}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i + 1) * 0.1, duration: 0.6 }}
              >
                <CardContent dest={dest} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA below */}
        <div className="container mx-auto px-5 mt-10 sm:mt-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link
              to="/#quiz"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              🧭 Descubre tu destino ideal
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DidYouKnowSection;
