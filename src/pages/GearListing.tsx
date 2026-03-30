import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { CardGridSkeleton } from "@/components/LoadingSkeletons";
import { useCanonical, SITE_URL, usePageMeta } from "@/hooks/use-seo";
import { useGearArticles } from "@/hooks/use-gear-articles";
import type { Tables } from "@/integrations/supabase/types";
import JsonLd from "@/components/JsonLd";

type GearArticle = Tables<"gear_articles">;

const categories = ["Todo", "Botas", "Bastones", "Mochilas", "Fotografía", "Ropa", "Accesorios"];

const GearListing = () => {
  const { data: articles = [], isLoading, error } = useGearArticles();

  useCanonical();

  usePageMeta({
    title: "Guía de Equipo",
    description: "Todo lo que necesitas para tu aventura, revisado por expertos para principiantes.",
  });

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Guía de Equipo — Nomaderia Adventures",
    description: "Todo lo que necesitas para tu aventura, revisado por expertos para principiantes.",
    url: `${SITE_URL}/gear`,
    inLanguage: "es",
    isPartOf: { "@type": "WebSite", name: "Nomaderia Adventures", url: SITE_URL },
  };

  const filter = (cat: string) =>
    cat === "Todo" ? articles : articles.filter((a) => a.category === cat);

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <JsonLd data={collectionLd} />
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-serif text-4xl md:text-5xl font-bold text-foreground text-center mb-4"
          >
            Guía de Equipo
          </motion.h1>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            Todo lo que necesitas para tu aventura, revisado por expertos para principiantes.
          </p>

          {isLoading && <CardGridSkeleton count={3} />}

          {error && (
            <p className="text-center text-muted-foreground py-8">
              No se pudieron cargar los artículos. Intenta recargar la página.
            </p>
          )}

          {!isLoading && !error && (
            <Tabs defaultValue="Todo" className="w-full">
              <TabsList className="bg-muted mb-8 flex flex-wrap gap-1 h-auto">
                {categories.map((cat) => (
                  <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
                ))}
              </TabsList>
              {categories.map((cat) => (
                <TabsContent key={cat} value={cat}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filter(cat).map((a) => (
                      <Link
                        key={a.id}
                        to={`/gear/${a.slug}`}
                        className="bg-card rounded-xl overflow-hidden hover:scale-[1.03] transition-transform shadow-lg group"
                      >
                        <div className="h-44 overflow-hidden relative">
                          {a.hero_image_url ? (
                            <img src={a.hero_image_url} alt={a.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-accent/20 to-secondary/20" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>
                        <div className="p-5">
                          <Badge variant="outline" className="mb-2 border-card-foreground/20 text-card-foreground">
                            {a.category}
                          </Badge>
                          <h3 className="font-serif text-lg font-bold text-card-foreground mb-1">{a.title}</h3>
                          <p className="text-sm text-card-foreground/70 line-clamp-2">{a.short_description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(a.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                          <span className="text-primary text-sm font-medium mt-3 inline-block group-hover:underline">
                            Leer artículo →
                          </span>
                        </div>
                      </Link>
                    ))}
                    {filter(cat).length === 0 && (
                      <p className="col-span-full text-center text-muted-foreground py-8">
                        No hay artículos en esta categoría todavía.
                      </p>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default GearListing;
