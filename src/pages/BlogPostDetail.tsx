import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { GearArticleDetailSkeleton } from "@/components/LoadingSkeletons";
import { useCanonical, useJsonLd, usePageMeta, SITE_URL } from "@/hooks/use-seo";
import ShareButtons from "@/components/ShareButtons";

const estimateReadingTime = (markdown: string | null): number => {
  if (!markdown) return 1;
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  short_description: string | null;
  content_markdown: string | null;
  hero_image_url: string | null;
  author: string | null;
  created_at: string;
  updated_at: string;
  reading_time_min: number | null;
}

const BlogPostDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useCanonical();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      const p = data as BlogPost | null;
      setPost(p);
      if (p) {
        const { data: rel } = await supabase
          .from("blog_posts")
          .select("id, title, slug, category, short_description, hero_image_url, author, created_at, updated_at, reading_time_min")
          .eq("is_published", true)
          .eq("category", p.category)
          .neq("id", p.id)
          .limit(3);
        setRelated((rel as BlogPost[]) || []);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  const jsonLd = useMemo(() => {
    if (!post) return null;
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.short_description || "",
      image: post.hero_image_url || "",
      author: { "@type": "Person", name: post.author || "Nomaderia" },
      publisher: {
        "@type": "Organization",
        name: "Nomaderia Adventures",
        url: SITE_URL,
      },
      datePublished: post.created_at,
      dateModified: post.updated_at,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${SITE_URL}/blog/${post.slug}`,
      },
      wordCount: post.content_markdown ? post.content_markdown.trim().split(/\s+/).length : 0,
      inLanguage: "es",
    };
  }, [post]);

  const breadcrumbLd = useMemo(() => {
    if (!post) return null;
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
      ],
    };
  }, [post]);

  useJsonLd(jsonLd);
  useJsonLd(breadcrumbLd);

  const pageMeta = useMemo(
    () => {
      if (post) {
        return {
          title: post.title,
          description:
            post.short_description ||
            "Explora guías y artículos de viaje en Nomaderia.",
          image: post.hero_image_url || undefined,
          type: "article" as const,
        };
      }

      if (loading) {
        return {
          title: "Cargando artículo del blog",
          description: "Explora guías y artículos de viaje en Nomaderia.",
          type: "article" as const,
        };
      }

      return {
        title: "Artículo no encontrado",
        description:
          "El artículo que buscas no existe o ha sido movido. Explora otros contenidos en el blog de Nomaderia.",
        type: "article" as const,
      };
    },
    [post, loading]
  );

  usePageMeta(pageMeta);
  if (loading) return (
    <main className="bg-background min-h-screen"><Navbar />
      <div className="pt-20"><GearArticleDetailSkeleton /></div>
    </main>
  );

  if (!post) return (
    <main className="bg-background min-h-screen"><Navbar />
      <div className="pt-32 text-center">
        <h1 className="font-serif text-3xl text-foreground mb-4">Artículo no encontrado</h1>
        <Button asChild><Link to="/blog">← Volver al Blog</Link></Button>
      </div>
    </main>
  );

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <section className="pt-20">
        <div className="h-[35vh] flex items-end relative overflow-hidden">
          {post.hero_image_url ? (
            <img src={post.hero_image_url} alt={post.title} loading="eager" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-secondary/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <div className="container mx-auto px-4 pb-8 relative z-10">
            <nav className="text-sm flex items-center gap-1 mb-4" aria-label="Breadcrumb">
              <Link to="/" className="text-white/60 hover:text-white">Inicio</Link>
              <span className="text-white/40">/</span>
              <Link to="/blog" className="text-white/60 hover:text-white">Blog</Link>
              <span className="text-white/40">/</span>
              <span className="text-white/70 truncate max-w-[200px]" aria-current="page">{post.title}</span>
            </nav>
            <Badge variant="outline" className="border-white/20 text-white mb-3">{post.category}</Badge>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="font-serif text-3xl md:text-5xl font-bold text-white"
              style={{ textShadow: "0 2px 16px rgba(0,0,0,0.4)" }}>
              {post.title}
            </motion.h1>
            <div className="flex items-center gap-3 mt-2 text-white/60">
              <p className="text-white/60 mt-2">
                {post.author && <>por {post.author} · </>}
                {estimateReadingTime(post.content_markdown)} min de lectura ·{" "}
                {new Date(post.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="prose max-w-none text-foreground/90">
            <ReactMarkdown>{post.content_markdown || ""}</ReactMarkdown>
          </div>
          <div className="mt-10 pt-6 border-t border-border">
            <ShareButtons
              url={window.location.href}
              title={post.title}
              description={post.short_description || undefined}
            />
          </div>
        </div>
      </section>

      {/* CTA interno */}
      <div className="container mx-auto px-4 max-w-3xl pb-8">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
          <p className="text-foreground font-serif text-lg mb-2">¿Listo para tu primera aventura?</p>
          <p className="text-muted-foreground text-sm mb-4">Descubre qué destino es perfecto para ti con nuestro quiz de 1 minuto.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/#quiz" className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
              Hacer el Quiz
            </Link>
            <Link to="/calculadora" className="inline-flex items-center justify-center border border-border hover:bg-muted text-foreground px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
              Calcular Presupuesto
            </Link>
          </div>
        </div>
      </div>

      {/* WhatsApp CTA */}
      <div className="container mx-auto px-4 max-w-3xl pb-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex flex-col items-center text-center p-8">
            <h3 className="font-serif text-2xl text-foreground mb-2">
              ¿Necesitas ayuda para planear esto?
            </h3>
            <p className="text-muted-foreground mb-6">
              Yo te armo el viaje completo — desde $9 USD.
            </p>
            {buildWhatsAppUrl(`Hola Frank, leí tu artículo sobre ${post.title} y me gustaría ayuda para planear un viaje`) && (
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <a
                  href={buildWhatsAppUrl(`Hola Frank, leí tu artículo sobre ${post.title} y me gustaría ayuda para planear un viaje`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Escríbeme por WhatsApp →
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {related.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-3xl text-foreground mb-8 text-center">Artículos Relacionados</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {related.map((r) => (
                <Link key={r.id} to={`/blog/${r.slug}`} className="bg-card rounded-xl overflow-hidden hover:scale-[1.03] transition-transform shadow-lg group">
                  <div className="h-32 overflow-hidden relative">
                    {r.hero_image_url ? (
                      <img src={r.hero_image_url} alt={r.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent/20 to-secondary/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
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

export default BlogPostDetail;
