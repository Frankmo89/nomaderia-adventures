import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { CardGridSkeleton } from "@/components/LoadingSkeletons";
import { useCanonical } from "@/hooks/use-seo";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  short_description: string | null;
  hero_image_url: string | null;
  author: string | null;
  created_at: string;
}

const categories = ["Todo", "Preparación", "Errores", "Inspiración", "Consejos"];

const BlogListing = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useCanonical();

  useEffect(() => {
    document.title = "Blog — Nomaderia";
    const load = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, slug, category, short_description, hero_image_url, author, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      setPosts((data as BlogPost[]) || []);
      setLoading(false);
    };
    load();
    return () => { document.title = "Nomaderia — Tu Primera Aventura Te Está Esperando"; };
  }, []);

  const filter = (cat: string) =>
    cat === "Todo" ? posts : posts.filter((p) => p.category === cat);

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-serif text-4xl md:text-5xl font-bold text-foreground text-center mb-4"
          >
            Blog
          </motion.h1>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            Artículos, consejos y guías para preparar tu primera aventura al aire libre.
          </p>

          {loading ? (
            <CardGridSkeleton count={3} />
          ) : (
            <Tabs defaultValue="Todo" className="w-full">
              <TabsList className="bg-muted mb-8 flex flex-wrap gap-1 h-auto">
                {categories.map((cat) => (
                  <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
                ))}
              </TabsList>
              {categories.map((cat) => (
                <TabsContent key={cat} value={cat}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filter(cat).map((p) => (
                      <Link
                        key={p.id}
                        to={`/blog/${p.slug}`}
                        className="bg-card rounded-xl overflow-hidden hover:scale-[1.03] transition-transform shadow-lg group"
                      >
                        <div className="h-44 overflow-hidden relative">
                          {p.hero_image_url ? (
                            <img src={p.hero_image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-accent/20 to-secondary/20" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                        </div>
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="border-card-foreground/20 text-card-foreground">
                              {p.category}
                            </Badge>
                            {p.author && (
                              <span className="text-xs text-muted-foreground">por {p.author}</span>
                            )}
                          </div>
                          <h3 className="font-serif text-lg font-bold text-card-foreground mb-1">{p.title}</h3>
                          <p className="text-sm text-card-foreground/70 line-clamp-2">{p.short_description}</p>
                          <span className="text-primary text-sm font-medium mt-3 inline-block group-hover:underline">
                            Leer más →
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

export default BlogListing;
