import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { GearArticleDetailSkeleton } from "@/components/LoadingSkeletons";
import { useCanonical, useJsonLd, usePageMeta, SITE_URL } from "@/hooks/use-seo";
import ShareButtons from "@/components/ShareButtons";

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
      author: { "@type": "Organization", name: "Nomaderia" },
      publisher: { "@type": "Organization", name: "Nomaderia", logo: { "@type": "ImageObject", url: `${SITE_URL}/og-image.png` } },
      datePublished: post.created_at,
      dateModified: post.updated_at,
      mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${post.slug}` },
    };
  }, [post]);

  useJsonLd(jsonLd);

  usePageMeta({
    title: post?.title || "",
    description: post?.short_description || "",
    image: post?.hero_image_url || undefined,
    type: "article",
  });

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
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="container mx-auto px-4 pb-8 relative z-10">
            <Link to="/blog" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 mb-4">
              <ArrowLeft className="h-4 w-4" /> Volver al Blog
            </Link>
            <Badge variant="outline" className="border-foreground/20 text-foreground mb-3">{post.category}</Badge>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="font-serif text-3xl md:text-5xl font-bold text-foreground"
              style={{ textShadow: "0 2px 16px rgba(0,0,0,0.4)" }}>
              {post.title}
            </motion.h1>
            <div className="flex items-center gap-3 mt-2 text-muted-foreground">
              {post.author && <span>por {post.author}</span>}
              {post.reading_time_min && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.reading_time_min} min de lectura
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="prose prose-invert max-w-none text-foreground/90">
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

      {related.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-3xl text-foreground mb-8 text-center">Artículos Relacionados</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {related.map((r) => (
                <Link key={r.id} to={`/blog/${r.slug}`} className="bg-card rounded-xl overflow-hidden hover:scale-[1.03] transition-transform shadow-lg group">
                  <div className="h-32 overflow-hidden relative">
                    {r.hero_image_url ? (
                      <img src={r.hero_image_url} alt={r.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent/20 to-secondary/20" />
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

export default BlogPostDetail;
