import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { CardGridSkeleton } from "@/components/LoadingSkeletons";
import Reveal from "@/components/editorial/Reveal";
import { useBlogPosts } from "@/hooks/use-blog-posts";
import { CardImage, ImageFallback } from "@/components/shared/CardImage";

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
  const prefersReducedMotion = useReducedMotion();
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const hoverEnabled = canHover && !prefersReducedMotion;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // Elegir 3 posts al azar — se recalcula solo cuando cambia el array de posts
  const featured = useMemo(() => shuffleArray(posts).slice(0, 3), [posts]);
  const [feature, ...rest] = featured;
  const [featureImgFailed, setFeatureImgFailed] = useState(false);

  if (isLoading) {
    return (
      <section className="section-editorial bg-[#FFFBEB] relative overflow-hidden">
        <div className="container mx-auto px-5">
          <CardGridSkeleton count={3} />
        </div>
      </section>
    );
  }

  if (featured.length === 0) return null;

  return (
    <section className="section-editorial bg-[#FFFBEB] relative overflow-hidden section-recessed">
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
      }} />

      <div className="container mx-auto px-5 relative z-10">
        {/* Header */}
        <Reveal className="text-center mb-10 sm:mb-14">
          <span className="font-condensed text-xs tracking-[0.08em] uppercase font-semibold text-green mb-3 block">
            Publicaciones del blog
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-ink mb-3">
            Del Blog
          </h2>
          <p className="text-slate text-sm sm:text-base max-w-xl mx-auto">
            Tips, errores comunes y todo lo que necesitas saber antes de tu primera aventura.
          </p>
        </Reveal>

        {/* Feature: el primer post como tarjeta grande */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div initial="rest" whileHover={hoverEnabled ? "hover" : undefined}>
            <Link
              to={`/blog/${feature.slug}`}
              className="group block overflow-hidden rounded-2xl border border-stone/70 bg-card card-depth"
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden sm:h-80">
                {feature.hero_image_url && !featureImgFailed ? (
                  <motion.img
                    src={feature.hero_image_url}
                    alt={feature.title}
                    loading="lazy"
                    className="h-full w-full object-cover object-center img-warm"
                    variants={{ rest: { scale: 1 }, hover: { scale: 1.04 } }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    onError={() => setFeatureImgFailed(true)}
                  />
                ) : feature.hero_image_url ? (
                  <ImageFallback className="h-full w-full" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-accent/20 to-secondary/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/70 via-forest-dark/25 to-transparent" />
                <motion.div
                  variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 bg-gradient-to-t from-forest-dark/70 via-forest-dark/20 to-transparent pointer-events-none flex items-end p-3"
                >
                  <span className="text-white text-sm font-semibold tracking-wide">Leer →</span>
                </motion.div>
              </div>

              {/* Content */}
              <div className="p-5 sm:p-7">
                <div className="mb-3 flex items-center gap-2">
                  <Badge variant="outline" className="border-sage/30 text-xs text-sage">
                    {feature.category}
                  </Badge>
                  <span className="text-xs text-sage">{formatDate(feature.created_at)}</span>
                </div>
                <h3 className="mb-2 line-clamp-2 font-sans text-xl font-semibold text-ink transition-colors group-hover:text-green sm:text-2xl">
                  {feature.title}
                </h3>
                <p className="mb-3 line-clamp-2 text-sm text-slate sm:text-base">{feature.short_description}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-green transition-all group-hover:gap-2">
                  Leer más
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Lista editorial: el resto de posts como filas con divisores stone */}
        {rest.length > 0 && (
          <div className="mt-8 border-t border-stone/70">
            {rest.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="border-b border-stone/70"
              >
                <Link to={`/blog/${post.slug}`} className="group flex items-center gap-4 py-5">
                  {post.hero_image_url && (
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-36">
                      <CardImage
                        src={post.hero_image_url}
                        alt={post.title}
                        loading="lazy"
                        className="h-full w-full object-cover object-center img-warm"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="outline" className="border-sage/30 text-xs text-sage">
                        {post.category}
                      </Badge>
                      <span className="text-xs text-sage">{formatDate(post.created_at)}</span>
                    </div>
                    <h3 className="mb-1 line-clamp-2 font-sans font-semibold text-ink transition-colors group-hover:text-green">
                      {post.title}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-green transition-all group-hover:gap-2">
                      Leer más
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA: Ver todo el blog */}
        <Reveal className="text-center mt-10 sm:mt-14">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 border border-stone text-ink hover:bg-stone/30 px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            Ver todo el blog
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
};

export default BlogPreview;
