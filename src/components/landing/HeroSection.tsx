import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { logEvent } from "@/lib/events";
// Kept in place per perf task: query may stay unused for display.
import { useFeaturedHeroPark } from "@/hooks/use-destinations";

/**
 * Frank's own photos (public/hero/v2/): 01 Grand Canyon sunrise (LCP),
 * 02 Joshua Tree, 03 Yosemite road in snow, 04 Grand Canyon trail,
 * 05 Skull Rock, 06 Yosemite Falls in snow.
 * /hero/* is cached immutable — new photos go in a new folder (v3, …) and
 * HERO_BASE, the index.html preload and the script move together.
 */
const HERO_BASE = "/hero/v2";
const HERO_IDS = ["01", "02", "03", "04", "05", "06"] as const;
const HERO_WIDTHS = [640, 1080, 1600] as const;
const HERO_SIZES = "100vw";
const SLIDE_DURATION = 5000;
/** Fogata — the exact fill of "IA" in /brand/nomaderia-horizontal*.svg. */
const HERO_ORANGE = "#D97706";

const KEN_BURNS_CSS = `
@keyframes hero-ken-burns {
  from { transform: scale(1.0) translateX(0px); }
  to   { transform: scale(1.08) translateX(-12px); }
}
`;

function heroSrcSet(id: string, ext: "avif" | "webp"): string {
  return HERO_WIDTHS.map((w) => `${HERO_BASE}/${id}-${w}.${ext} ${w}w`).join(
    ", ",
  );
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
          src={`${HERO_BASE}/${id}-1080.webp`}
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

        {/* Gradient scrim — light at the very top (sky/navbar), then dark enough
            behind the text that the fogata line 2 of the H1 (#D97706) clears
            WCAG AA large text (≥3:1) on every rotation photo at 375–1440 px
            (worst measured ≈3.5:1). Was transparent 40% → 0.6 → 0.88 (≈1.0:1). */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            background:
              "linear-gradient(to bottom, rgba(10,25,10,0.3) 0%, rgba(10,25,10,0.84) 24%, rgba(10,25,10,0.84) 75%, rgba(10,25,10,0.92) 100%)",
          }}
        />
      </div>

      {/* Content — bottom-left, padded above the clipped curve (~78% safe zone).
          Same box as the navbar (`container mx-auto px-5`) so the logo, H1,
          subtitle and CTAs share one left edge at every width. */}
      <div className="absolute inset-x-0 bottom-0 pb-[25vh]" style={{ zIndex: 3 }}>
        <div className="container mx-auto px-5">
          <div className="max-w-2xl">
            {/* H1 + subtitle: no entrance animation / no opacity 0 — LCP text must
                paint as soon as React commits (PR #194 left LCP on the H1 waiting
                ~96% render-delay for Framer). */}
            <h1 className="font-serif font-bold text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-shadow-hero">
              <span className="block">Aquí nadie se pierde…</span>
              <em className="block" style={{ color: HERO_ORANGE }}>
                nomás se encuentra.
              </em>
            </h1>

            <p className="mt-4 text-lg md:text-xl text-white/90 max-w-xl font-sans text-shadow-card">
              Te armo tu viaje a un parque nacional: ruta día por día, equipo y
              presupuesto, a tu nivel. $49.
            </p>

            {/* CTAs — main = quiz (starts the sales flow); small text link = FAQ.
                No WhatsApp before purchase (WhatsApp is for paying customers). The
                AI assistant is gated off in prod (VITE_CONCIERGE_ENABLED), so the
                doubts link points to the FAQ until the assistant passes the exam.
                Explorar Destinos lives in the navbar (desktop + mobile menu). */}
            <div className="flex flex-col items-start gap-1 mt-8">
              <Link
                to="/#quiz"
                onClick={() => logEvent("hero_cta_click", { cta: "quiz" })}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-hero-accent text-white px-8 py-4 text-base font-semibold shadow-lg shadow-hero-accent/25 hover:bg-hero-accent/90 transition-colors"
              >
                Encuentra tu parque →
              </Link>

              <Link
                to="/#faq"
                onClick={() => logEvent("hero_cta_click", { cta: "faq" })}
                className="inline-flex min-h-[44px] items-center px-2 -ml-2 text-sm font-medium text-white/90 underline underline-offset-4 decoration-white/50 hover:text-white hover:decoration-white text-shadow-card"
              >
                ¿Dudas? Lee las preguntas frecuentes
              </Link>

              {/* Trust line (was a pill above the H1) */}
              <p className="mt-2 flex items-start gap-2 text-xs sm:text-sm text-white/80 font-sans text-shadow-card">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-px" aria-hidden="true" />
                <span>Agente de Viajes Certificado (TAP) · Itinerario en menos de 48 h</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
