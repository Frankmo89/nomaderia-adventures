import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { CardGridSkeleton } from "@/components/LoadingSkeletons";
import { useBlogPosts } from "@/hooks/use-blog-posts";

/**
 * Fisher-Yates shuffle — returns a new shuffled copy of the array.
 * Runs once per mount (useMemo with posts ref) so the cards stay
 * stable during the session but change on every page reload.
 */
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const BlogPreview = () => {
  const { data: posts = [], isLoading } = useBlogPosts();

  // Elegir 3 posts al azar — se recalcula solo cuando cambia el array de posts
  const featured = useMemo(() => shuffleArray(posts).slice(0, 3), [posts]);

  if (isLoading) {
    return (
      <section className="py-16 sm:py-20 bg-muted relative overflow-hidden">
        <div className="container mx-auto px-5">
          <CardGridSkeleton count={3} />
        </div>
      </section>
    );
  }

  if (featured.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-background relative overflow-hidden">
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
      }} />

      <div className="container mx-auto px-5 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-3 block">
            Publicaciones del blog
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3">
            Del Blog
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Tips, errores comunes y todo lo que necesitas saber antes de tu primera aventura.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
            >
              <Link
                to={`/blog/${post.slug}`}
                className="block bg-card rounded-2xl overflow-hidden shadow-lg group hover:scale-[1.02] transition-transform duration-300"
              >
                {/* Image */}
                <div className="h-48 overflow-hidden relative">
                  {post.hero_image_url ? (
                    <img
                      src={post.hero_image_url}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-accent/20 to-secondary/20" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="border-card-foreground/20 text-card-foreground text-xs">
                      {post.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-card-foreground/70 line-clamp-2 mb-3">
                    {post.short_description}
                  </p>
                  <span className="text-primary text-sm font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Leer más
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA: Ver todo el blog */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10 sm:mt-14"
        >
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 border border-border hover:bg-muted text-foreground px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            Ver todo el blog
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default BlogPreview;
