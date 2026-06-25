import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DestinationCardGridSkeleton } from "@/components/LoadingSkeletons";
import Reveal from "@/components/editorial/Reveal";
import { useDestinations } from "@/hooks/use-destinations";

const difficultyColor: Record<string, string> = {
  easy: "bg-secondary text-secondary-foreground",
  moderate: "bg-primary/80 text-primary-foreground",
  challenging: "bg-destructive text-destructive-foreground",
};
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
  const [activeSlideByLevel, setActiveSlideByLevel] = useState<Record<string, number>>({
    all: 0,
    easy: 0,
    moderate: 0,
    challenging: 0,
  });

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const hoverEnabled = canHover && !prefersReducedMotion;

  const filterByDifficulty = (level: string) =>
    level === "all" ? destinations : destinations.filter((d) => d.difficulty_level === level);

  const handleCarouselScroll = (level: string, element: HTMLDivElement) => {
    const children = Array.from(element.children) as HTMLElement[];
    if (children.length === 0) return;

    const viewportCenter = element.scrollLeft + element.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    children.forEach((child, index) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(viewportCenter - childCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveSlideByLevel((prev) =>
      prev[level] === nearestIndex ? prev : { ...prev, [level]: nearestIndex },
    );
  };

  const DestCard = ({ d, index }: { d: (typeof destinations)[0]; index: number }) => (
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
          className="group block h-full overflow-hidden rounded-2xl border border-stone/70 bg-card card-depth"
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
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/30 to-primary/20">
                <MapPin className="h-12 w-12 text-primary/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
            <motion.div
              variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none flex items-end p-3"
            >
              <span className="text-white text-sm font-semibold tracking-wide">Explorar →</span>
            </motion.div>
            <div className="absolute left-3 top-3 flex gap-2">
              <Badge className={difficultyColor[d.difficulty_level]}>{difficultyLabel[d.difficulty_level]}</Badge>
            </div>
          </div>
          <div className="flex h-full flex-col p-4 sm:p-5">
            <h3 className="mb-1 font-serif text-lg font-bold text-card-foreground">{d.title}</h3>
            <p className="mb-2 text-sm text-card-foreground/70">
              {countryFlag[d.country] || ""} {d.country}
            </p>
            <p className="mb-4 line-clamp-2 text-sm text-card-foreground/80">{d.short_description}</p>
            <div className="mt-auto flex flex-col gap-3 border-t border-stone/60 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-card-foreground/60">
                <span className="flex shrink-0 items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {d.days_needed}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" /> ~${d.estimated_budget_usd}
                </span>
              </div>
              <span className="shrink-0 whitespace-nowrap font-medium text-primary group-hover:underline">
                Ver Guía →
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <section id="destinos" className="bg-foreground section-editorial">
        <div className="container mx-auto px-5">
          <DestinationCardGridSkeleton count={6} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="destinos" className="bg-foreground section-editorial">
        <div className="container mx-auto px-5 text-center">
          <p className="text-background/70">No se pudieron cargar los destinos. Intenta recargar la página.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="destinos" className="relative overflow-hidden bg-foreground section-editorial section-recessed">
      <div className="noise-bg pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="container relative z-10 mx-auto px-5">
        <Reveal className="mb-8 text-center sm:mb-10">
          <h2 className="mb-3 font-serif text-2xl font-bold text-background sm:mb-4 sm:text-3xl md:text-5xl">
            Encuentra Tu Aventura
          </h2>
          <p className="text-sm text-background/70 sm:text-base">Elige tu nivel y descubre lo que es posible</p>
        </Reveal>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6 flex w-full overflow-x-auto bg-muted sm:mx-auto sm:mb-8 sm:w-fit">
            <TabsTrigger value="all" className="min-h-[44px] flex-1 text-sm sm:flex-none">
              Todos
            </TabsTrigger>
            <TabsTrigger value="easy" className="min-h-[44px] flex-1 text-sm sm:flex-none">
              Fácil
            </TabsTrigger>
            <TabsTrigger value="moderate" className="min-h-[44px] flex-1 text-sm sm:flex-none">
              Moderado
            </TabsTrigger>
            <TabsTrigger value="challenging" className="min-h-[44px] flex-1 text-sm sm:flex-none">
              Desafiante
            </TabsTrigger>
          </TabsList>

          {["all", "easy", "moderate", "challenging"].map((level) => {
            const filtered =
              limit !== undefined ? filterByDifficulty(level).slice(0, limit) : filterByDifficulty(level);

            return (
              <TabsContent key={level} value={level}>
                <div
                  className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:gap-6 md:overflow-visible lg:grid-cols-3"
                  onScroll={(event) => handleCarouselScroll(level, event.currentTarget)}
                >
                  {filtered.map((d, i) => (
                    <div key={d.id} className="min-w-[86%] snap-center md:min-w-0">
                      <DestCard d={d} index={i} />
                    </div>
                  ))}
                </div>

                {filtered.length > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2 md:hidden" aria-hidden="true">
                    {filtered.map((_, dotIndex) => (
                      <span
                        key={`${level}-dot-${dotIndex}`}
                        className={`h-1.5 rounded-full transition-all duration-200 ${
                          dotIndex === activeSlideByLevel[level] ? "w-5 bg-primary/80" : "w-1.5 bg-background/30"
                        }`}
                      />
                    ))}
                  </div>
                )}
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
              className="rounded-full border-stone/80 bg-white/72 shadow-editorial transition-all duration-200 hover:-translate-y-0.5 hover:bg-sand hover:shadow-editorial-hover active:translate-y-0 active:scale-[0.98]"
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
