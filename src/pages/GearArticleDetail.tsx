import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Star, ExternalLink, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { GearArticleDetailSkeleton } from "@/components/LoadingSkeletons";
import { useCanonical, useJsonLd } from "@/hooks/use-seo";
import type { Tables } from "@/integrations/supabase/types";

type GearArticle = Tables<"gear_articles">;

interface Product {
  name: string;
  price: string;
  rating: number;
  pros: string[];
  cons: string[];
  affiliate_url: string;
  image_url?: string;
}

const GearArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<GearArticle | null>(null);
  const [related, setRelated] = useState<GearArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useCanonical();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("gear_articles")
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      setArticle(data);
      if (data) {
        document.title = `${data.title} — Nomaderia`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute("content", data.short_description || "");
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute("content", `${data.title} — Nomaderia`);
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute("content", data.short_description || "");
        if (data.hero_image_url) {
          const ogImage = document.querySelector('meta[property="og:image"]');
          if (ogImage) ogImage.setAttribute("content", data.hero_image_url);
        }
        const { data: rel } = await supabase
          .from("gear_articles")
          .select("*")
          .eq("is_published", true)
          .eq("category", data.category)
          .neq("id", data.id)
          .limit(3);
        setRelated(rel || []);
      }
      setLoading(false);
    };
    load();
    return () => {
      document.title = "Nomaderia — Tu Primera Aventura Te Está Esperando";
    };
  }, [slug]);

  const jsonLd = useMemo(() => {
    if (!article) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.short_description || "",
      image: article.hero_image_url || "",
      author: { "@type": "Organization", name: "Nomaderia" },
      datePublished: article.created_at,
      dateModified: article.updated_at,
      publisher: { "@type": "Organization", name: "Nomaderia" },
    };
  }, [article]);

  useJsonLd(jsonLd);

  if (loading) return (
    <main className="bg-background min-h-screen"><Navbar />
      <div className="pt-20"><GearArticleDetailSkeleton /></div>
    </main>
  );

  if (!article) return (
    <main className="bg-background min-h-screen"><Navbar />
      <div className="pt-32 text-center">
        <h1 className="font-serif text-3xl text-foreground mb-4">Artículo no encontrado</h1>
        <Button asChild><Link to="/gear">← Volver a Gear Guide</Link></Button>
      </div>
    </main>
  );

  const products = (article.products as unknown as Product[]) || [];

  return (
    <main className="bg-background min-h-screen">
      <Navbar />

      <section className="pt-20">
        <div className="h-[35vh] flex items-end relative overflow-hidden">
          {article.hero_image_url ? (
            <img src={article.hero_image_url} alt={article.title} loading="eager" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-secondary/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="container mx-auto px-4 pb-8 relative z-10">
            <Link to="/gear" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 mb-4">
              <ArrowLeft className="h-4 w-4" /> Volver a Gear Guide
            </Link>
            <Badge variant="outline" className="border-foreground/20 text-foreground mb-3">{article.category}</Badge>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="font-serif text-3xl md:text-5xl font-bold text-foreground"
              style={{ textShadow: "0 2px 16px rgba(0,0,0,0.4)" }}>
              {article.title}
            </motion.h1>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="prose prose-invert max-w-none text-foreground/90 mb-12">
            <ReactMarkdown>{article.content_markdown || ""}</ReactMarkdown>
          </div>
          {products.length > 0 && (
            <>
              <div className="bg-muted/30 border border-border rounded-lg p-3 mb-6">
                <p className="text-xs text-muted-foreground">
                  📋 <strong>Transparencia:</strong> Esta guía contiene enlaces de afiliado a Amazon. Si compras a través de ellos, ganamos una pequeña comisión sin costo extra para ti. Solo recomendamos productos que consideramos útiles para principiantes.
                </p>
              </div>
              <h2 className="font-serif text-2xl text-foreground mb-6">Productos Recomendados</h2>
              <div className="space-y-6">
                {products.map((p, i) => (
                  <Card key={i} className="bg-card border-border overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-32 h-32 bg-gradient-to-br from-accent/10 to-secondary/10 rounded-lg flex items-center justify-center shrink-0">
                          <BookOpen className="h-8 w-8 text-accent/40" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-serif text-lg font-bold text-card-foreground mb-1">{p.name}</h3>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-primary font-bold">{p.price}</span>
                            <span className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, si) => (
                                <Star key={si} className={`h-4 w-4 ${si < p.rating ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                              ))}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-sm">
                            <div>
                              <p className="text-secondary font-medium mb-1">Pros</p>
                              <ul className="list-disc list-inside text-card-foreground/70">{p.pros?.map((pro, pi) => <li key={pi}>{pro}</li>)}</ul>
                            </div>
                            <div>
                              <p className="text-destructive font-medium mb-1">Contras</p>
                              <ul className="list-disc list-inside text-card-foreground/70">{p.cons?.map((con, ci) => <li key={ci}>{con}</li>)}</ul>
                            </div>
                          </div>
                          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <a href={p.affiliate_url || "#"} target="_blank" rel="noopener noreferrer sponsored">Ver en Amazon <ExternalLink className="ml-1 h-3 w-3" /></a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-3xl text-foreground mb-8 text-center">Artículos Relacionados</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {related.map((r) => (
                <Link key={r.id} to={`/gear/${r.slug}`} className="bg-card rounded-xl overflow-hidden hover:scale-[1.03] transition-transform shadow-lg group">
                  <div className="h-32 overflow-hidden relative">
                    {r.hero_image_url ? (
                      <img src={r.hero_image_url} alt={r.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent/20 to-secondary/20 flex items-center justify-center"><BookOpen className="h-8 w-8 text-accent/40" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                  </div>
                  <div className="p-4">
                    <Badge variant="outline" className="mb-2 border-card-foreground/20 text-card-foreground">{r.category}</Badge>
                    <h3 className="font-serif text-base font-bold text-card-foreground">{r.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 py-8 text-center">
        <Button variant="outline" className="border-border text-foreground hover:bg-muted" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑ Volver arriba</Button>
      </div>
      <Footer />
    </main>
  );
};

export default GearArticleDetail;
