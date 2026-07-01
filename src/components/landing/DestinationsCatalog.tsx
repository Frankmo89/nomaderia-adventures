import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, DollarSign, Star, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DestinationCardGridSkeleton } from "@/components/LoadingSkeletons";
import Reveal from "@/components/editorial/Reveal";
import { useDestinations } from "@/hooks/use-destinations";
import { formatRegionDisplay } from "@/lib/regions";

// Dificultad: badge calmado green-wash para todos los niveles (Design System
// §4.1). Se diferencia por el texto, no por color de semáforo.
const difficultyLabel: Record<string, string> = {
  easy: "Fácil",
  moderate: "Moderado",
  challenging: "Desafiante",
};

const countryFlag: Record<string, string> = {
  "México": "🇲🇽",
  Mexico: "🇲🇽",
  "Estados Unidos": "🇺🇸",
  "España": "🇪🇸",
  Espana: "🇪🇸",
  Argentina: "🇦🇷",
  Nepal: "🇳🇵",
};

interface DestinationsCatalogProps {
  limit?: number;
}

const DestinationsCatalog = ({ limit }: DestinationsCatalogProps) => {
  const { data: destinations = [], isLoading, error } = useDestinations();
  const prefersReducedMotion = useReducedMotion();
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const hoverEnabled = canHover && !prefersReducedMotion;

  // Solo mostrar la pestaña "Desafiante" si hay destinos publicados con ese nivel.
  const hasChallenging = destinations.some((d) => d.difficulty_level === "challenging");
  const levels = ["all", "easy", "moderate", ...(hasChallenging ? ["challenging"] : [])];
  const tabLabel: Record<string, string> = {
    all: "Todos",
    easy: "Fácil",
    moderate: "Moderado",
    challenging: "Desafiante",
  };

  const filterByDifficulty = (level: string) =>
    level === "all" ? destinations : destinations.filter((d) => d.difficulty_level === level);

  const DestCard = ({ d, index }: { d: (typeof destinations)[0]; index: number }) => {
    const regionDisplay = formatRegionDisplay(d.region);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="h-full"
      >
        <motion.div initial="rest" whileHover={hoverEnabled ? "hover" : undefined} className="h-full">
          <Link
            to={`/destinos/${d.slug}`}
            className="group block h-full overflow-hidden rounded-2xl border border-stone bg-white shadow-[0_4px_16px_rgba(20,32,26,0.08)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(20,32,26,0.12)]"
          >
            <div className="relative h-56 overflow-hidden sm:h-52">
              {d.hero_image_url ? (
                <motion.img
                  src={d.hero_image_url}
                  alt={d.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top img-warm"
                  variants={{ rest: { scale: 1 }, hover: { scale: 1.04 } }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-green-wash">
                  <MapPin className="h-12 w-12 text-green/40" />
                </div>
              )}
              {/* Scrim con forest-dark (no negro puro) — Design System §4.3 */}
              <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/70 via-forest-dark/25 to-transparent" />
              <motion.div
                variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 bg-gradient-to-t from-forest-dark/70 via-forest-dark/20 to-transparent pointer-events-none flex items-end p-3"
              >
                <span className="text-white text-sm font-semibold tracking-wide">Explorar →</span>
              </motion.div>
              {/* Chip de guardar (decorativo, estilo AllTrails) */}
              <div
                aria-hidden
                className="pointer-events-none absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm"
              >
                <Bookmark className="h-4 w-4 text-slate" />
              </div>
              <div className="absolute left-3 top-3 flex gap-2">
                <Badge variant="difficulty">{difficultyLabel[d.difficulty_level]}</Badge>
              </div>
            </div>
            <div className="flex h-full flex-col p-4 sm:p-5">
              <h3 className="mb-1 text-lg font-semibold text-ink">{d.title}</h3>
              {/* Línea meta: estrella verde + dificultad + ubicación, en sage */}
              <p className="mb-2 flex items-center gap-1.5 text-sm text-sage">
                <Star className="h-3.5 w-3.5 shrink-0 fill-green text-green" />
                <span>
                  {difficultyLabel[d.difficulty_level]} · {countryFlag[d.country] || ""} {d.country}
                  {regionDisplay ? ` · ${regionDisplay}` : ""}
                </span>
              </p>
              <p className="mb-4 line-clamp-2 text-sm text-slate">{d.short_description}</p>
              <div className="mt-auto flex flex-col gap-3 border-t border-stone pt-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-sage">
                  <span className="flex shrink-0 items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {d.days_needed}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" /> ~${d.estimated_budget_usd}
                  </span>
                </div>
                <span className="shrink-0 whitespace-nowrap font-semibold text-green group-hover:underline">
                  Ver Guía →
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <section id="destinos" className="bg-forest-dark section-editorial">
        <div className="container mx-auto px-5">
          <DestinationCardGridSkeleton count={6} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="destinos" className="bg-forest-dark section-editorial">
        <div className="container mx-auto px-5 text-center">
          <p className="text-cloud/70">No se pudieron cargar los destinos. Intenta recargar la página.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="destinos" className="relative overflow-hidden bg-forest-dark section-editorial section-recessed">
      <div className="noise-bg pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="container relative z-10 mx-auto px-5">
        <Reveal className="mb-8 text-center sm:mb-10">
          <h2 className="mb-3 font-serif text-2xl font-bold text-cloud sm:mb-4 sm:text-3xl md:text-5xl">
            Encuentra Tu Aventura
          </h2>
          <p className="text-sm text-cloud/70 sm:text-base">Elige tu nivel y descubre lo que es posible</p>
        </Reveal>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6 flex w-full overflow-x-auto bg-spruce sm:mx-auto sm:mb-8 sm:w-fit">
            {levels.map((level) => (
              <TabsTrigger key={level} value={level} className="min-h-[44px] flex-1 text-sm sm:flex-none text-cloud/70 data-[state=active]:text-ink">
                {tabLabel[level]}
              </TabsTrigger>
            ))}
          </TabsList>

          {levels.map((level) => {
            const filtered =
              limit !== undefined ? filterByDifficulty(level).slice(0, limit) : filterByDifficulty(level);

            return (
              <TabsContent key={level} value={level}>
                {/* Grid asimétrico: 1 destino grande (feature) + el resto en
                    tratamiento chico. Mobile: feature full-width arriba, los dos
                    chicos 2-up debajo. Desktop: feature 2/3 (cols 1-2, 2 filas),
                    chicos apilados en la columna 1/3. */}
                <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 lg:gap-6">
                  {filtered.map((d, i) => (
                    <div
                      key={d.id}
                      className={i === 0 ? "col-span-2 lg:row-span-2" : "col-span-1"}
                    >
                      <DestCard d={d} index={i} />
                    </div>
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        {limit !== undefined && (
          <Reveal className="mt-10 flex justify-center">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-cloud/70 bg-transparent text-cloud transition-all duration-200 hover:-translate-y-0.5 hover:bg-cloud hover:text-forest-dark active:translate-y-0 active:scale-[0.98]"
            >
              <Link to="/destinos">Ver todos los destinos →</Link>
            </Button>
          </Reveal>
        )}
      </div>
    </section>
  );
};

export default DestinationsCatalog;
