import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardGridSkeleton } from "@/components/LoadingSkeletons";
import { useFeaturedGearArticles } from "@/hooks/use-gear-articles";

const categoryLabel: Record<string, string> = {
  boots: "Botas", poles: "Bastones", cameras: "Fotografía",
  backpacks: "Mochilas", clothing: "Ropa", accessories: "Accesorios",
};

const categoryImage: Record<string, string> = {
  boots: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80",
  poles: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80",
  cameras: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80",
};

const GearPreview = () => {
  const { data: articles = [], isLoading } = useFeaturedGearArticles();

  return (
    <section className="py-16 sm:py-20 bg-muted relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none noise-bg" />
      <div className="container mx-auto px-5 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-2xl sm:text-3xl md:text-5xl font-bold text-foreground text-center mb-2"
        >
          Equipo Para Principiantes
        </motion.h2>
        <p className="text-center text-muted-foreground mb-10 sm:mb-12 text-sm sm:text-base">
          No necesitas gastar miles. Estas son las únicas cosas que realmente necesitas.
        </p>

        {isLoading ? (
          <CardGridSkeleton count={3} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 mb-8 sm:mb-10">
            {articles.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Link
                  to={`/gear/${a.slug}`}
                  className="block bg-card rounded-xl overflow-hidden active:scale-[0.98] sm:hover:scale-[1.03] transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-primary/10 group"
                >
                  <div className="h-48 sm:h-48 overflow-hidden relative">
                    <img
                      src={categoryImage[a.category] || categoryImage.boots}
                      alt={a.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                  </div>
                  <div className="p-4 sm:p-5">
                    <Badge className="bg-secondary text-secondary-foreground mb-3">
                      {categoryLabel[a.category] || a.category}
                    </Badge>
                    <h3 className="font-serif text-lg font-bold text-card-foreground mb-2">{a.title}</h3>
                    <p className="text-sm text-card-foreground/70">{a.short_description}</p>
                    <span className="text-primary text-sm font-medium mt-3 inline-block group-hover:underline">Leer Guía →</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center">
          <Button asChild variant="outline" className="border-foreground/30 text-foreground hover:bg-foreground/10 h-12 min-w-[200px]">
            <Link to="/gear">Ver Todo el Equipo →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GearPreview;
