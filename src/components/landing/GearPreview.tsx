import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface GearArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  short_description: string;
}

const categoryLabel: Record<string, string> = {
  boots: "Botas",
  poles: "Bastones",
  cameras: "Fotografía",
  backpacks: "Mochilas",
  clothing: "Ropa",
  accessories: "Accesorios",
};

const GearPreview = () => {
  const [articles, setArticles] = useState<GearArticle[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("gear_articles")
        .select("id, title, slug, category, short_description")
        .eq("is_published", true)
        .eq("featured", true)
        .limit(3);
      setArticles((data as GearArticle[]) || []);
    };
    fetch();
  }, []);

  return (
    <section className="py-20 bg-muted">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-3xl md:text-5xl font-bold text-foreground text-center mb-2"
        >
          Equipo Para Principiantes
        </motion.h2>
        <p className="text-center text-muted-foreground mb-12">
          No necesitas gastar miles. Estas son las únicas cosas que realmente necesitas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {articles.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/gear/${a.slug}`}
                className="block bg-card rounded-xl overflow-hidden hover:scale-[1.03] transition-transform duration-300 shadow-lg"
              >
                <div className="h-40 bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
                  <ShoppingBag className="h-10 w-10 text-primary/40" />
                </div>
                <div className="p-5">
                  <Badge className="bg-secondary text-secondary-foreground mb-3">
                    {categoryLabel[a.category] || a.category}
                  </Badge>
                  <h3 className="font-serif text-lg font-bold text-card-foreground mb-2">{a.title}</h3>
                  <p className="text-sm text-card-foreground/70">{a.short_description}</p>
                  <span className="text-primary text-sm font-medium mt-3 inline-block">Leer Guía →</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Button asChild variant="outline" className="border-foreground/30 text-foreground hover:bg-foreground/10">
            <Link to="/gear">Ver Todo el Equipo →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GearPreview;
