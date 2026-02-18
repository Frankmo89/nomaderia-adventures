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

  const DestCard = ({ d }: { d: Destination }) => (
    <Link
      to={`/destinos/${d.slug}`}
      className="block bg-card rounded-xl overflow-hidden hover:scale-[1.03] transition-transform duration-300 shadow-lg group"
    >
      {/* Image placeholder */}
      <div className="h-48 bg-gradient-to-br from-secondary/30 to-primary/20 flex items-center justify-center">
        <MapPin className="h-12 w-12 text-primary/40" />
      </div>
      <div className="p-5">
        <div className="flex gap-2 mb-3">
          <Badge className={difficultyColor[d.difficulty_level]}>{difficultyLabel[d.difficulty_level]}</Badge>
          <Badge variant="outline" className="text-card-foreground border-card-foreground/20">
            <Clock className="h-3 w-3 mr-1" /> {d.days_needed}
          </Badge>
        </div>
        <h3 className="font-serif text-lg font-bold text-card-foreground mb-1">{d.title}</h3>
        <p className="text-sm text-card-foreground/70 mb-2">
          {countryFlag[d.country] || ""} {d.country}
        </p>
        <p className="text-sm text-card-foreground/80 mb-3 line-clamp-2">{d.short_description}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-card-foreground/60 flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" /> ~${d.estimated_budget_usd} USD
          </span>
          <span className="text-primary text-sm font-medium group-hover:underline">Ver Guía →</span>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <section id="destinos" className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center text-muted-foreground">Cargando destinos...</div>
      </section>
    );
  }

  return (
    <section id="destinos" className="py-20 bg-background">
      <div className="container mx-auto px-4">
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
                {filterByDifficulty(level).map((d) => (
                  <DestCard key={d.id} d={d} />
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
