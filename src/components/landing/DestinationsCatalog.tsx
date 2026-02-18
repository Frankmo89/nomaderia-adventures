import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Clock, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface Destination {
  id: string;
  title: string;
  slug: string;
  country: string;
  short_description: string;
  difficulty_level: string;
  days_needed: string;
  estimated_budget_usd: number;
  hero_image_url: string;
  tags: string[];
}

const difficultyColor: Record<string, string> = {
  easy: "bg-secondary text-secondary-foreground",
  moderate: "bg-primary/80 text-primary-foreground",
  challenging: "bg-destructive text-destructive-foreground",
};
const difficultyLabel: Record<string, string> = { easy: "Fácil", moderate: "Moderado", challenging: "Desafiante" };

const countryFlag: Record<string, string> = {
  México: "🇲🇽",
  "Estados Unidos": "🇺🇸",
  España: "🇪🇸",
  Argentina: "🇦🇷",
  Nepal: "🇳🇵",
};

const DestinationsCatalog = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("destinations")
        .select("id, title, slug, country, short_description, difficulty_level, days_needed, estimated_budget_usd, hero_image_url, tags")
        .eq("is_published", true);
      setDestinations((data as Destination[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filterByDifficulty = (level: string) =>
    level === "all" ? destinations : destinations.filter((d) => d.difficulty_level === level);

  const DestCard = ({ d, index }: { d: Destination; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
    >
      <Link
        to={`/destinos/${d.slug}`}
        className="block bg-card rounded-xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-primary/10 hover:scale-[1.02] group"
      >
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          {d.hero_image_url ? (
            <img
              src={d.hero_image_url}
              alt={d.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-primary/20 flex items-center justify-center">
              <MapPin className="h-12 w-12 text-primary/40" />
            </div>
          )}
          {/* Gradient overlay for badge readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={difficultyColor[d.difficulty_level]}>{difficultyLabel[d.difficulty_level]}</Badge>
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-serif text-lg font-bold text-card-foreground mb-1">{d.title}</h3>
          <p className="text-sm text-card-foreground/70 mb-2">
            {countryFlag[d.country] || ""} {d.country}
          </p>
          <p className="text-sm text-card-foreground/80 mb-3 line-clamp-2">{d.short_description}</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-card-foreground/60 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {d.days_needed}
            </span>
            <span className="text-card-foreground/60 flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" /> ~${d.estimated_budget_usd} USD
            </span>
            <span className="text-primary font-medium group-hover:underline">Ver Guía →</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );

  if (loading) {
    return (
      <section id="destinos" className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center text-muted-foreground">Cargando destinos...</div>
      </section>
    );
  }

  return (
    <section id="destinos" className="py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
      }} />
      <div className="container mx-auto px-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-3xl md:text-5xl font-bold text-foreground text-center mb-4"
        >
          Encuentra Tu Aventura
        </motion.h2>
        <p className="text-center text-muted-foreground mb-10">Elige tu nivel y descubre lo que es posible</p>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mx-auto flex w-fit bg-muted mb-8">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="easy">Fácil</TabsTrigger>
            <TabsTrigger value="moderate">Moderado</TabsTrigger>
            <TabsTrigger value="challenging">Desafiante</TabsTrigger>
          </TabsList>
          {["all", "easy", "moderate", "challenging"].map((level) => (
            <TabsContent key={level} value={level}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterByDifficulty(level).map((d, i) => (
                  <DestCard key={d.id} d={d} index={i} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default DestinationsCatalog;
