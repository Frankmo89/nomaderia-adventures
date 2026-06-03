import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { CardGridSkeleton } from "@/components/LoadingSkeletons";
import Reveal from "@/components/editorial/Reveal";
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
  const prefersReducedMotion = useReducedMotion();
  const [canHover, setCanHover] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const hoverEnabled = canHover && !prefersReducedMotion;

  const handleCarouselScroll = (element: HTMLDivElement) => {
    const children = Array.from(element.children) as HTMLElement[];
    if (children.length === 0) return;

    const viewportCenter = element.scrollLeft + element.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    children.forEach((child, index) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(viewportCenter - childCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveSlide((prev) => (prev === nearestIndex ? prev : nearestIndex));
  };

  // Elegir 3 posts al azar — se recalcula solo cuando cambia el array de posts
  const featured = useMemo(() => shuffleArray(posts).slice(0, 3), [posts]);

  if (isLoading) {
    return (
      <section className="py-16 sm:py-20 bg-wash-sand relative overflow-hidden">
        <div className="container mx-auto px-5">
          <CardGridSkeleton count={3} />
        </div>
      </section>
    );
  }

  if (featured.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-wash-sand relative overflow-hidden section-recessed">
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
      }} />

      <div className="container mx-auto px-5 relative z-10">
        {/* Header */}
        <Reveal className="text-center mb-10 sm:mb-14">
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-3 block">
            Publicaciones del blog
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3">
            Del Blog
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Tips, errores comunes y todo lo que necesitas saber antes de tu primera aventura.
          </p>
        </Reveal>

        {/* Cards carousel */}
        <div
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3"
          onScroll={(event) => handleCarouselScroll(event.currentTarget)}
        >
          {featured.map((post, i) => (
            <div key={post.id} className="min-w-[86%] snap-center md:min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                <motion.div initial="rest" whileHover={hoverEnabled ? "hover" : undefined} className="h-full">
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group block h-full overflow-hidden rounded-2xl border border-stone/70 bg-card card-depth"
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      {post.hero_image_url ? (
                        <motion.img
                          src={post.hero_image_url}
                          alt={post.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                          variants={{ rest: { scale: 1 }, hover: { scale: 1.04 } }}
                          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-accent/20 to-secondary/20" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <motion.div
                        variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none flex items-end p-3"
                      >
                        <span className="text-white text-sm font-semibold tracking-wide">Leer →</span>
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <Badge variant="outline" className="border-card-foreground/20 text-xs text-card-foreground">
                          {post.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="mb-2 line-clamp-2 font-serif text-lg font-bold text-card-foreground transition-colors group-hover:text-primary">
                        {post.title}
                      </h3>
                      <p className="mb-3 line-clamp-2 text-sm text-card-foreground/70">{post.short_description}</p>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all group-hover:gap-2">
                        Leer más
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          ))}
        </div>

        {featured.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2 md:hidden" aria-hidden="true">
            {featured.map((_, dotIndex) => (
              <span
                key={`blog-dot-${dotIndex}`}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  dotIndex === activeSlide ? "w-5 bg-primary/80" : "w-1.5 bg-foreground/20"
                }`}
              />
            ))}
          </div>
        )}

        {/* CTA: Ver todo el blog */}
        <Reveal className="text-center mt-10 sm:mt-14">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 border border-border hover:bg-muted text-foreground px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
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
