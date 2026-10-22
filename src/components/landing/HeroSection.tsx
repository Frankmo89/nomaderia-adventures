import { useEffect, useRef, useState } from "react";
import { MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { logEvent } from "@/lib/events";
import { heroFallbackSrc, heroSrcSet } from "@/lib/hero-photos";
// Kept in place per perf task: query may stay unused for display.
import { useFeaturedHeroPark } from "@/hooks/use-destinations";

/**
 * Frank's own photos (paths in src/lib/hero-photos.ts).
 * /hero/* is cached immutable — new photos go in a new folder (v3, …) and
 * HERO_BASE, the index.html preload and the script move together.
 * `place` only names the park: never a trail or viewpoint we have not checked.
 *
 * Order = what people see first. On a phone only the top ~30% of the photo is
 * clean, so slide 1 needs a strong top: Joshua Tree (also the closest park to
 * SoCal). Slide 1 is the LCP image — keep the index.html preload on its id.
 */
const HERO_SLIDES = [
  { id: "02", place: "Joshua Tree · California" },
  { id: "04", place: "Grand Canyon · Arizona" },
  { id: "03", place: "Yosemite · California" },
  { id: "01", place: "Grand Canyon · Arizona" },
  { id: "05", place: "Joshua Tree · California" },
  { id: "06", place: "Yosemite · California" },
] as const;
const HERO_SIZES = "100vw";
const SLIDE_DURATION = 5000;
/** Fogata — the exact fill of "IA" in /brand/nomaderia-horizontal*.svg. */
const HERO_ORANGE = "#D97706";

/*
 * Light, not a blanket. The old scrim put 84% forest over the whole photo so
 * the fogata line of the H1 would pass contrast; the photos read as mud.
 * Now the dark sits only where text sits:
 *  - < lg: clean photo above the text block. `--hero-text-top` (set from the
 *    real layout, see HeroSection) is where the dark starts, so it holds on a
 *    375×667 phone and a 430×932 one alike.
 *  - lg+: the text is a left column; dark on the left, photo clean on the right.
 *    `--hero-col-right` is the column's right edge (container px-5 + max-w).
 * A thin band at the top keeps the transparent navbar readable.
 * Colour: Forest Charcoal #14201A (design-system: scrims).
 */
const HERO_CSS = `
@keyframes hero-ken-burns {
  from { transform: scale(1.0) translateX(0px); }
  to   { transform: scale(1.08) translateX(-12px); }
}
@keyframes hero-story-fill {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes hero-place-in {
  from { opacity: 0; transform: translateY(3px); }
  to   { opacity: 1; transform: none; }
}
.hero-place { animation: hero-place-in 0.5s ease both; }
.hero-photo {
  filter: saturate(1.15) contrast(1.05);
  animation: hero-ken-burns 8s ease-in-out infinite alternate;
}
.hero-scrim {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  background:
    linear-gradient(to bottom, rgba(20,32,26,0.55) 0px, rgba(20,32,26,0) 140px),
    linear-gradient(to bottom,
      rgba(20,32,26,0) calc(var(--hero-text-top, 30%) - 110px),
      rgba(20,32,26,0.64) calc(var(--hero-text-top, 30%) - 10px),
      rgba(20,32,26,0.85) calc(var(--hero-text-top, 30%) + 40px),
      rgba(20,32,26,0.9) 100%);
}
@media (min-width: 1024px) {
  .hero-scrim {
    --hero-col-right: 596px;
    background:
      linear-gradient(to bottom, rgba(20,32,26,0.5) 0px, rgba(20,32,26,0) 140px),
      linear-gradient(to right,
        rgba(20,32,26,0.87) 0px,
        rgba(20,32,26,0.85) var(--hero-col-right),
        rgba(20,32,26,0) calc(var(--hero-col-right) + 24vw)),
      linear-gradient(to bottom, rgba(20,32,26,0) 62%, rgba(20,32,26,0.45) 100%);
  }
}
@media (min-width: 1280px) {
  .hero-scrim { --hero-col-right: 692px; }
}
@media (min-width: 1400px) {
  /* container caps at 1400px: left edge = (100% - 1400px) / 2 + 20px */
  .hero-scrim { --hero-col-right: calc(50% - 8px); }
}
.hero-story-fill {
  transform-origin: left;
  animation: hero-story-fill ${SLIDE_DURATION}ms linear forwards;
}
/* Short phones (SE): the H1 starts right under the bars; keep the bars only. */
@media (max-width: 1023px) and (max-height: 740px) {
  .hero-place-chip { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .hero-photo { animation: none; }
  .hero-story-fill { animation: none; }
  .hero-place { animation: none; }
}
`;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
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
          src={heroFallbackSrc(id)}
          alt=""
          width={1600}
          height={900}
          decoding={priority ? "sync" : "async"}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          className="hero-photo"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            animationDelay: `${index * -2}s`,
          }}
        />
      </picture>
    </div>
  );
}

type HeroStoriesProps = {
  active: number;
  reducedMotion: boolean;
  onSelect: (index: number) => void;
};

/** Instagram-style progress bars + where the photo was taken. */
function HeroStories({ active, reducedMotion, onSelect }: HeroStoriesProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-1.5" role="group" aria-label="Fotos del hero">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`Foto ${i + 1} de ${HERO_SLIDES.length}: ${slide.place}`}
            aria-current={i === active ? "true" : undefined}
            className="group flex h-6 flex-1 items-center lg:w-9 lg:flex-none"
          >
            <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-white/35 group-hover:bg-white/55">
              {i < active && <span className="absolute inset-0 bg-white" />}
              {i === active && (
                <span
                  key={`fill-${active}`}
                  className={reducedMotion ? "absolute inset-0 bg-white" : "hero-story-fill absolute inset-0 bg-white"}
                />
              )}
            </span>
          </button>
        ))}
      </div>
      <p
        className="hero-place-chip inline-flex items-center gap-1.5 self-start rounded-full bg-black/50 px-3 py-1.5 font-condensed text-xs font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm lg:self-end"
        aria-live="off"
      >
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span key={HERO_SLIDES[active].id} className="hero-place">
          {HERO_SLIDES[active].place}
        </span>
      </p>
    </div>
  );
}

const HeroSection = () => {
  // Intentionally unused for display — leave the Supabase query in place.
  useFeaturedHeroPark();

  const [active, setActive] = useState(0);
  const [restReady, setRestReady] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

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

  // One timer per slide, so a tap on a bar restarts the count.
  // Reduced motion: no autoplay; the bars still let people browse.
  useEffect(() => {
    if (!restReady || reducedMotion) return;
    const t = window.setTimeout(() => {
      setActive((prev) => (prev + 1) % HERO_SLIDES.length);
    }, SLIDE_DURATION);
    return () => window.clearTimeout(t);
  }, [active, restReady, reducedMotion]);

  // Where the text block starts, so the scrim (< lg) darkens from there down
  // and leaves the photo above it clean, whatever the phone's height.
  useEffect(() => {
    const section = sectionRef.current;
    const text = textRef.current;
    if (!section || !text) return;
    const update = () => {
      const top = text.getBoundingClientRect().top - section.getBoundingClientRect().top;
      section.style.setProperty("--hero-text-top", `${Math.round(top)}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(section);
    ro.observe(text);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const select = (index: number) => {
    setRestReady(true);
    setActive(index);
    logEvent("hero_photo_select", { photo: HERO_SLIDES[index].id });
  };

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden">
      <style>{HERO_CSS}</style>

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
        <HeroSlide id={HERO_SLIDES[0].id} active={active === 0} priority index={0} />

        {/* Remaining slides — mounted only after idle (or on first tap) */}
        {restReady &&
          HERO_SLIDES.slice(1).map((slide, i) => (
            <HeroSlide
              key={slide.id}
              id={slide.id}
              active={active === i + 1}
              priority={false}
              index={i + 1}
            />
          ))}

        <div className="hero-scrim" />
      </div>

      {/* Stories + place: under the navbar on phones (over the clean photo),
          bottom-right on desktop (over the clean right half). */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[72px] md:top-[112px] lg:top-auto lg:bottom-[24vh]"
        style={{ zIndex: 4 }}
      >
        <div className="container mx-auto flex px-5 lg:justify-end">
          <div className="pointer-events-auto w-full lg:w-auto">
            <HeroStories active={active} reducedMotion={reducedMotion} onSelect={select} />
          </div>
        </div>
      </div>

      {/* Content — bottom-left, padded above the clipped curve.
          Same box as the navbar (`container mx-auto px-5`) so the logo, H1,
          subtitle and CTAs share one left edge at every width. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 pb-[20vh] md:pb-[25vh]" style={{ zIndex: 3 }}>
        <div className="container mx-auto px-5">
          <div ref={textRef} className="pointer-events-auto max-w-xl xl:max-w-2xl">
            {/* H1 + subtitle: no entrance animation / no opacity 0 — LCP text must
                paint as soon as React commits (PR #194 left LCP on the H1 waiting
                ~96% render-delay for Framer). */}
            <h1 className="font-serif font-bold text-white text-4xl sm:text-5xl md:text-6xl xl:text-7xl leading-tight text-shadow-hero">
              <span className="block">Aquí nadie se pierde…</span>
              <em
                className="block"
                style={{ color: HERO_ORANGE, textShadow: "0 2px 14px rgba(0,0,0,0.55)" }}
              >
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
            <div className="flex flex-col items-start gap-1 mt-6 sm:mt-8">
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
