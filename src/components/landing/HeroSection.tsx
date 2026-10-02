import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/whatsapp";
// Kept in place per perf task: query may stay unused for display.
import { useFeaturedHeroPark } from "@/hooks/use-destinations";

const WHATSAPP_URL = buildWhatsAppLink(
  "Hola Nomaderia 👋 Tengo una duda antes de comprar el Itinerario Completo."
);

/** Curated local hero set (public/hero/). Frank can replace sources later. */
const HERO_IDS = ["01", "02", "03", "04", "05", "06"] as const;
const HERO_WIDTHS = [640, 1080, 1600] as const;
const HERO_SIZES = "100vw";
const SLIDE_DURATION = 5000;

const KEN_BURNS_CSS = `
@keyframes hero-ken-burns {
  from { transform: scale(1.0) translateX(0px); }
  to   { transform: scale(1.08) translateX(-12px); }
}
`;

function heroSrcSet(id: string, ext: "avif" | "webp"): string {
  return HERO_WIDTHS.map((w) => `/hero/${id}-${w}.${ext} ${w}w`).join(", ");
}

type HeroSlideProps = {
  id: string;
  active: boolean;
  /** LCP slide: eager + high priority, no opacity fade on first paint */
  priority: boolean;
  index: number;
};

function HeroSlide({ id, active, priority, index }: HeroSlideProps) {
  return (
    <div
      aria-hidden={!active}
      style={{
        position: "absolute",
        inset: 0,
        opacity: active ? 1 : 0,
        // First paint of the LCP slide must not wait on a fade-in.
        transition: priority ? undefined : "opacity 1.2s ease",
      }}
    >
      <picture>
        <source
          type="image/avif"
          srcSet={heroSrcSet(id, "avif")}
          sizes={HERO_SIZES}
        />
        <source
          type="image/webp"
          srcSet={heroSrcSet(id, "webp")}
          sizes={HERO_SIZES}
        />
        <img
          src={`/hero/${id}-1080.webp`}
          alt=""
          width={1600}
          height={900}
          decoding={priority ? "sync" : "async"}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            animation: "hero-ken-burns 8s ease-in-out infinite alternate",
            animationDelay: `${index * -2}s`,
          }}
        />
      </picture>
    </div>
  );
}

const HeroSection = () => {
  // Intentionally unused for display — leave the Supabase query in place.
  useFeaturedHeroPark();

  const [active, setActive] = useState(0);
  const [restReady, setRestReady] = useState(false);

  // Defer slides 02–06 until the main thread is idle (or ~1.5s fallback).
  useEffect(() => {
    let cancelled = false;
    const enableRest = () => {
      if (!cancelled) setRestReady(true);
    };
    const ric = window.requestIdleCallback?.bind(window);
    if (ric) {
      const idleId = ric(enableRest, { timeout: 1500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(idleId);
      };
    }
    const t = window.setTimeout(enableRest, 1);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!restReady) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % HERO_IDS.length);
    }, SLIDE_DURATION);
    return () => window.clearInterval(id);
  }, [restReady]);

  return (
    <section className="relative min-h-screen overflow-hidden">
      <style>{KEN_BURNS_CSS}</style>

      {/* Background layer — slides + scrim, clipped to soft mountain silhouette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          WebkitMaskImage: "url('/hero-mask.svg')",
          maskImage: "url('/hero-mask.svg')",
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      >
        {/* LCP slide — always mounted, eager, no fade delay */}
        <HeroSlide id="01" active={active === 0} priority index={0} />

        {/* Remaining curated slides — mounted only after idle */}
        {restReady &&
          HERO_IDS.slice(1).map((id, i) => (
            <HeroSlide
              key={id}
              id={id}
              active={active === i + 1}
              priority={false}
              index={i + 1}
            />
          ))}

        {/* Gradient scrim — sky stays clean, bottom text zone is readable */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            background:
              "linear-gradient(to bottom, transparent 40%, rgba(10,25,10,0.6) 70%, rgba(10,25,10,0.88) 100%)",
          }}
        />
      </div>

      {/* Content — bottom-left, padded above the clipped curve (~78% safe zone) */}
      <div
        className="absolute bottom-0 left-0 max-w-2xl px-8 pb-[25vh] md:px-14 lg:px-20"
        style={{ zIndex: 3 }}
      >
        {/* TAP badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-black/20 border border-white/20 backdrop-blur-sm rounded-full px-5 py-2.5 mb-5 text-xs sm:text-sm text-white/80 font-sans shadow-editorial"
        >
          <ShieldCheck className="h-4 w-4 text-hero-accent shrink-0" />
          <span>Agente de Viajes Certificado (TAP) · Respuesta en {"<"} 24h</span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="font-serif font-bold text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-shadow-hero"
        >
          Tu Primera <em style={{ color: "#FCD34D" }}>Aventura</em>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-4 text-lg md:text-xl text-white/90 max-w-xl font-sans text-shadow-card"
        >
          Te armo tu viaje completo —itinerario, equipo y presupuesto— adaptado
          a tu nivel.{" "}
          <em style={{ color: "#FCD34D" }}>Todo en español.</em>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8"
        >
          <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }}>
            <Button
              asChild
              className="rounded-full bg-hero-accent text-white h-auto px-8 py-4 text-base font-semibold shadow-lg shadow-hero-accent/25 hover:bg-hero-accent/90 transition-colors"
            >
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                ¿Dudas? Escríbenos
              </a>
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }}>
            <Link
              to="/destinos"
              className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-sm text-white px-8 py-4 text-base font-medium hover:bg-white/20 transition-colors"
            >
              Explorar Destinos →
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
