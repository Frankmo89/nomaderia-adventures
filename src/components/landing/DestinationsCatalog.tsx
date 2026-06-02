import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Clock, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DestinationCardGridSkeleton } from "@/components/LoadingSkeletons";
import { useDestinations } from "@/hooks/use-destinations";

const difficultyColor: Record<string, string> = {
  easy: "bg-secondary text-secondary-foreground",
  moderate: "bg-primary/80 text-primary-foreground",
  challenging: "bg-destructive text-destructive-foreground",
};
const difficultyLabel: Record<string, string> = { easy: "Fácil", moderate: "Moderado", challenging: "Desafiante" };

const countryFlag: Record<string, string> = {
  México: "🇲🇽", "Estados Unidos": "🇺🇸", España: "🇪🇸", Argentina: "🇦🇷", Nepal: "🇳🇵",
};

interface DestinationsCatalogProps {
  limit?: number;
}

const DestinationsCatalog = ({ limit }: DestinationsCatalogProps) => {
  const { data: destinations = [], isLoading, error } = useDestinations();

  const filterByDifficulty = (level: string) =>
    level === "all" ? destinations : destinations.filter((d) => d.difficulty_level === level);

  const DestCard = ({ d, index }: { d: (typeof destinations)[0]; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
    >
      <Link
        to={`/destinos/${d.slug}`}
        className="group block h-full overflow-hidden rounded-2xl border border-stone/70 bg-card shadow-editorial transition-all duration-300 hover:-translate-y-0.5 hover:shadow-editorial-hover active:scale-[0.99]"
      >
        <div className="relative h-56 sm:h-52 overflow-hidden">
          {d.hero_image_url ? (
            <img
              src={d.hero_image_url}
              alt={d.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-primary/20 flex items-center justify-center">
              <MapPin className="h-12 w-12 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={difficultyColor[d.difficulty_level]}>{difficultyLabel[d.difficulty_level]}</Badge>
          </div>
        </div>
        <div className="flex h-full flex-col p-4 sm:p-5">
          <h3 className="font-serif text-lg font-bold text-card-foreground mb-1">{d.title}</h3>
          <p className="text-sm text-card-foreground/70 mb-2">
            {countryFlag[d.country] || ""} {d.country}
          </p>
          <p className="text-sm text-card-foreground/80 mb-4 line-clamp-2">{d.short_description}</p>
          <div className="mt-auto flex flex-col gap-3 border-t border-stone/60 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 text-sm">
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-card-foreground/60">
              <span className="flex items-center gap-1 shrink-0">
              <Clock className="h-3.5 w-3.5" /> {d.days_needed}
              </span>
              <span className="flex items-center gap-1 shrink-0">
              <DollarSign className="h-3.5 w-3.5" /> ~${d.estimated_budget_usd}
              </span>
            </div>
            <span className="shrink-0 whitespace-nowrap text-primary font-medium group-hover:underline">Ver Guía →</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );

  if (isLoading) {
    return (
      <section id="destinos" className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-5">
          <DestinationCardGridSkeleton count={6} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="destinos" className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-5 text-center">
          <p className="text-muted-foreground">No se pudieron cargar los destinos. Intenta recargar la página.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="destinos" className="py-16 sm:py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none noise-bg" />
      <div className="container mx-auto px-5 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-2xl sm:text-3xl md:text-5xl font-bold text-foreground text-center mb-3 sm:mb-4"
        >
          Encuentra Tu Aventura
        </motion.h2>
        <p className="text-center text-muted-foreground mb-8 sm:mb-10 text-sm sm:text-base">Elige tu nivel y descubre lo que es posible</p>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mx-auto flex w-full sm:w-fit bg-muted mb-6 sm:mb-8 overflow-x-auto">
            <TabsTrigger value="all" className="min-h-[44px] text-sm flex-1 sm:flex-none">Todos</TabsTrigger>
            <TabsTrigger value="easy" className="min-h-[44px] text-sm flex-1 sm:flex-none">Fácil</TabsTrigger>
            <TabsTrigger value="moderate" className="min-h-[44px] text-sm flex-1 sm:flex-none">Moderado</TabsTrigger>
            <TabsTrigger value="challenging" className="min-h-[44px] text-sm flex-1 sm:flex-none">Desafiante</TabsTrigger>
          </TabsList>
          {["all", "easy", "moderate", "challenging"].map((level) => (
            <TabsContent key={level} value={level}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {(limit !== undefined ? filterByDifficulty(level).slice(0, limit) : filterByDifficulty(level)).map((d, i) => (
                  <DestCard key={d.id} d={d} index={i} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {limit !== undefined && (
          <div className="flex justify-center mt-10">
            <Button asChild variant="outline" size="lg" className="rounded-full border-stone/80 bg-white/72 shadow-editorial transition-all duration-200 hover:-translate-y-0.5 hover:bg-sand hover:shadow-editorial-hover active:translate-y-0 active:scale-[0.98]">
              <Link to="/destinos">Ver todos los destinos →</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default DestinationsCatalog;
