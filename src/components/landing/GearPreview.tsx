import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardGridSkeleton } from "@/components/LoadingSkeletons";
import Reveal from "@/components/editorial/Reveal";
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
  const prefersReducedMotion = useReducedMotion();
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const hoverEnabled = canHover && !prefersReducedMotion;

  return (
    <section className="section-editorial bg-cloud relative overflow-hidden section-recessed">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none noise-bg" />
      <div className="container mx-auto px-5 relative z-10">
        <Reveal className="text-center mb-10 sm:mb-12">
          <span className="font-condensed text-xs tracking-[0.08em] uppercase font-semibold text-green mb-3 block">
            Gear esencial
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl font-bold text-ink mb-2">
            Equipo Para Principiantes
          </h2>
          <p className="text-slate text-sm sm:text-base">
            No necesitas gastar miles. Estas son las únicas cosas que realmente necesitas.
          </p>
        </Reveal>

        {isLoading ? (
          <CardGridSkeleton count={3} />
        ) : (
          /* Scroll horizontal con snap — invita a explorar; la siguiente tarjeta
             asoma en el borde para señalar que hay más. Touch-friendly. */
          <div className="mb-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 sm:mb-10 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
            {articles.map((a, i) => (
              <motion.div
                key={a.id}
                initial="rest"
                whileHover={hoverEnabled ? "hover" : undefined}
                className="min-w-[80%] snap-center sm:min-w-[320px]"
              >
                <Link
                  to={`/gear/${a.slug}`}
                  className="block bg-card rounded-xl overflow-hidden card-depth"
                >
                  <div className="h-48 sm:h-48 overflow-hidden relative">
                    <motion.img
                      src={categoryImage[a.category] || categoryImage.boots}
                      alt={a.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover object-center img-warm"
                      variants={{ rest: { scale: 1 }, hover: { scale: 1.04 } }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/70 via-forest-dark/25 to-transparent" />
                    <motion.div
                      variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0 bg-gradient-to-t from-forest-dark/70 via-forest-dark/20 to-transparent pointer-events-none flex items-end p-3"
                    >
                      <span className="text-white text-sm font-semibold tracking-wide">Explorar →</span>
                    </motion.div>
                  </div>
                  <div className="p-4 sm:p-5">
                    <Badge className="bg-green-wash text-green border-0 mb-3">
                      {categoryLabel[a.category] || a.category}
                    </Badge>
                    <h3 className="font-sans font-semibold text-lg text-ink mb-2">{a.title}</h3>
                    <p className="text-sm text-slate">{a.short_description}</p>
                    <span className="text-green text-sm font-medium mt-3 inline-block">Leer Guía →</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <Reveal className="text-center">
          <Button asChild variant="outline" className="border-slate/40 text-slate hover:bg-slate/10 h-12 min-w-[200px]">
            <Link to="/gear">Ver Todo el Equipo →</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
};

export default GearPreview;
