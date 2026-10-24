import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { MapPin, Pause, Play, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { logEvent } from "@/lib/events";
import { heroSlides, nextHeroSlide, type HeroSlide } from "@/lib/hero-slides";
import { useHeroGalleryPhotos } from "@/hooks/use-hero-gallery";
// Kept in place per perf task: query may stay unused for display.
import { useFeaturedHeroPark } from "@/hooks/use-destinations";

/**
 * Home hero (ADR-047): the photo is the screen.
 *  - Phones and tablets: story-style. The photo fills the whole screen behind
 *    the transparent navbar; the text sits at the bottom on a dark fade that
 *    ends in solid forest-dark, so the dark promise band below follows with
 *    no seam. The top stays clear except a faint shade for the white logo.
 *  - lg+: text on the left on the light ground, the photo in a tall frame on
 *    the right with the same vertical shape. The navbar starts solid here
 *    (see hasHeroForPath).
 * Photos fill their frame (object-cover). The frame has the shape of the
 * phone shots Frank uploads, so they lose only a thin edge.
 *
 * Photos cross-fade every 6 s (ADR-046). The first is always the local cover
 * below (the LCP image: keep the index.html preload on its id). After it come
 * the photos Frank keeps active in /admin/galeria, in his order, resized by
 * Supabase; their chip shows the place he typed. With no gallery photos, the
 * local set below plays. `place` names only the park, never a trail or
 * viewpoint we have not checked.
 */
const HERO_PHOTOS = [
  { id: "02", place: "Joshua Tree · California", alt: "Un árbol de Joshua y rocas bajo cielo azul en Joshua Tree" },
  { id: "04", place: "Grand Canyon · Arizona", alt: "Sendero de roca roja con un excursionista en el Gran Cañón" },
  { id: "03", place: "Yosemite · California", alt: "Carretera con nieve y un túnel entre pinos en Yosemite" },
  { id: "01", place: "Grand Canyon · Arizona", alt: "Vista del Gran Cañón al amanecer con nubes largas" },
  { id: "05", place: "Joshua Tree · California", alt: "Skull Rock, una roca con forma de calavera, en Joshua Tree" },
  { id: "06", place: "Yosemite · California", alt: "Bosque nevado frente a Yosemite Falls" },
] as const;
/** Keep in sync with `imagesizes` on the index.html preload. */
const HERO_SIZES = "(min-width: 1024px) 420px, 100vw";
const SLIDE_MS = 6000;

/* The fade behind the text on phones starts 9rem above the text block, so it
   follows the text however tall the screen or the copy is: dark from the chip
   down (≥ 0.86, measured on snow), solid forest-dark at the very bottom. */
const HERO_CSS = `
.hero-scrim {
  background: linear-gradient(
    to bottom,
    rgba(20, 32, 26, 0) 0,
    rgba(20, 32, 26, 0.5) 4.5rem,
    rgba(20, 32, 26, 0.86) 9rem,
    rgba(20, 32, 26, 0.94) 70%,
    #14201a 100%
  );
}
@keyframes hero-place-in {
  from { opacity: 0; transform: translateY(3px); }
  to { opacity: 1; transform: none; }
}
.hero-place { animation: hero-place-in 0.5s ease both; }
@media (prefers-reduced-motion: reduce) {
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

/** One photo: AVIF/WebP sets for local photos, Supabase-resized for gallery ones. */
function HeroPhoto({
  slide,
  cover,
  alt,
  className,
  style,
}: {
  slide: HeroSlide;
  cover: boolean;
  alt: string;
  className: string;
  style: CSSProperties;
}) {
  return (
    <picture>
      {slide.local && <source type="image/avif" srcSet={slide.local.avif} sizes={HERO_SIZES} />}
      {slide.local && <source type="image/webp" srcSet={slide.local.webp} sizes={HERO_SIZES} />}
      <img
        src={slide.src}
        srcSet={slide.local ? undefined : slide.srcSet}
        sizes={slide.local ? undefined : HERO_SIZES}
        alt={alt}
        aria-hidden={alt ? undefined : true}
        width={1080}
        height={1440}
        decoding={cover ? "sync" : "async"}
        loading="eager"
        fetchPriority={cover ? "high" : "low"}
        className={className}
        style={style}
      />
    </picture>
  );
}

const HeroSection = () => {
  // Intentionally unused for display — leave the Supabase query in place.
  useFeaturedHeroPark();

  // Frank's active gallery photos (ADR-046); local set until they arrive.
  const { data: gallery, isPending: galleryPending } = useHeroGalleryPhotos();
  const slides = useMemo(() => heroSlides(HERO_PHOTOS, gallery), [gallery]);
  const coverOnce = slides.some((slide) => slide.key.startsWith("gallery-"));

  const [active, setActive] = useState(0);
  // Slides after the cover mount once the main thread is idle, and only the
  // current and the next one, so a visit downloads what it shows.
  const [restReady, setRestReady] = useState(false);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const currentKey = useRef(slides[0].key);

  useEffect(() => {
    let cancelled = false;
    const enableRest = () => {
      if (!cancelled) setRestReady(true);
    };
    const ric = window.requestIdleCallback?.bind(window);
    if (ric) {
      const id = ric(enableRest, { timeout: 1500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }
    const t = window.setTimeout(enableRest, 1);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  // When the gallery list arrives (or changes), keep showing the same photo
  // if it is still there; otherwise go on to the first gallery photo.
  useEffect(() => {
    const at = slides.findIndex((slide) => slide.key === currentKey.current);
    setActive(at >= 0 ? at : Math.min(1, slides.length - 1));
  }, [slides]);

  const safeActive = Math.min(active, slides.length - 1);
  const nextIndex = nextHeroSlide(safeActive, slides.length, coverOnce);
  const current = slides[safeActive];
  currentKey.current = current.key;

  useEffect(() => {
    setSeen((prev) => (prev.has(current.key) ? prev : new Set(prev).add(current.key)));
  }, [current.key]);

  // Only turn while the photos are on screen.
  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // One timer per photo. "Reduce motion": the first photo stays.
  const turning =
    restReady && !galleryPending && !reducedMotion && !userPaused && !hovered && onScreen && slides.length > 1;
  useEffect(() => {
    if (!turning) return;
    const t = window.setTimeout(() => setActive(nextIndex), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [safeActive, nextIndex, turning]);

  return (
    <section className="relative flex h-[100svh] min-h-[540px] flex-col justify-end overflow-hidden bg-forest-dark lg:block lg:h-auto lg:min-h-0 lg:overflow-visible lg:bg-cloud lg:pt-[76px]">
      <style>{HERO_CSS}</style>
      <div className="lg:container lg:mx-auto lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16 lg:px-5 lg:py-12 xl:gap-24">
        {/* Photos: the whole screen on phones, a tall frame on lg+. */}
        <div className="absolute inset-0 lg:relative lg:inset-auto lg:order-2">
          {/* lg+: the next photo waits behind, tilted, like a stack of prints.
              Same URLs as the front, so the browser fetches nothing extra. */}
          {slides.length > 1 && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 hidden origin-bottom-right -translate-x-[7%] -rotate-6 overflow-hidden rounded-[2rem] bg-mist shadow-[0_18px_40px_-18px_rgba(20,32,26,0.4)] lg:block xl:-translate-x-[12%]"
            >
              {slides.map((slide, i) => {
                const mounted = restReady && !galleryPending && (seen.has(slide.key) || i === safeActive || i === nextIndex);
                if (!mounted) return null;
                return (
                  <div
                    key={slide.key}
                    className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
                    style={{ opacity: i === nextIndex ? 1 : 0 }}
                  >
                    <HeroPhoto
                      slide={slide}
                      cover={false}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ filter: "saturate(0.85) brightness(0.9)" }}
                    />
                  </div>
                );
              })}
            </div>
          )}
          <div
            ref={frameRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative h-full w-full overflow-hidden bg-forest-dark lg:aspect-[3/5] lg:h-[min(76vh,700px)] lg:w-auto lg:rounded-[2rem] lg:shadow-[0_24px_60px_-20px_rgba(20,32,26,0.35)]"
          >
            {slides.map((slide, i) => {
              const cover = i === 0;
              // Wait for the gallery list before fetching a second photo, so a
              // local one is not downloaded only to be replaced.
              const mounted =
                cover || (restReady && !galleryPending && (seen.has(slide.key) || i === safeActive || i === nextIndex));
              if (!mounted) return null;
              const shown = i === safeActive;
              return (
                <div
                  key={slide.key}
                  aria-hidden={!shown}
                  className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
                  style={{ opacity: shown ? 1 : 0 }}
                >
                  <HeroPhoto
                    slide={slide}
                    cover={cover}
                    alt={slide.alt}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ filter: "saturate(1.06) contrast(1.03)" }}
                  />
                </div>
              );
            })}
            {/* Keeps the white logo and menu readable over the sky (phones). */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-forest-dark/55 to-transparent lg:hidden"
            />
            {current.place && (
              <p className="absolute bottom-5 left-5 hidden items-center gap-1.5 rounded-full bg-forest-dark/75 px-3 py-1.5 font-condensed text-xs font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm lg:inline-flex">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span key={current.key} className="hero-place">
                  {current.place}
                </span>
              </p>
            )}
            {/* Pause for keyboard users (WCAG 2.2.2); hidden until focused, as
                in the quiz video (ADR-042). The mouse pauses by hovering. */}
            {!reducedMotion && (
              <button
                type="button"
                onClick={() => setUserPaused((p) => !p)}
                aria-label={userPaused ? "Seguir pasando las fotos" : "Pausar las fotos"}
                className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:right-5 focus-visible:top-[92px] focus-visible:z-20 focus-visible:inline-flex focus-visible:h-11 focus-visible:w-11 focus-visible:items-center focus-visible:justify-center focus-visible:rounded-full focus-visible:bg-forest-dark/80 focus-visible:text-cloud focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cloud lg:focus-visible:bottom-5 lg:focus-visible:top-auto"
              >
                {userPaused ? <Play className="h-5 w-5" aria-hidden="true" /> : <Pause className="h-5 w-5" aria-hidden="true" />}
              </button>
            )}
          </div>
        </div>

        {/* Text — same left edge as the navbar (`container px-5`). */}
        <div className="relative lg:order-1">
          <div aria-hidden="true" className="hero-scrim pointer-events-none absolute inset-x-0 -top-36 bottom-0 lg:hidden" />
          <div className="container relative mx-auto px-5 pb-10 sm:pb-14 lg:mx-0 lg:max-w-none lg:p-0 [text-shadow:0_1px_12px_rgba(20,32,26,0.5)] lg:[text-shadow:none]">
            {/* Place of the photo on phones. Its row keeps its height when a
                photo has no place, so the text never jumps. */}
            <div className="mb-3 h-[30px] lg:hidden">
              {current.place && (
                <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-condensed text-xs font-semibold uppercase tracking-[0.08em] text-white ring-1 ring-white/20 backdrop-blur-sm [text-shadow:none]">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span key={current.key} className="hero-place">
                    {current.place}
                  </span>
                </p>
              )}
            </div>

            {/* H1 + subtitle paint with the first commit: no entrance animation
                (PR #194: LCP text waiting on Framer). */}
            <h1 className="font-serif text-[2rem] font-bold leading-[1.12] text-white sm:text-5xl lg:text-ink xl:text-6xl">
              <span className="block">Aquí nadie se pierde…</span>
              <em className="block text-hero-accent lg:text-green">nomás se encuentra.</em>
            </h1>

            <p className="mt-3 max-w-xl font-sans text-base leading-relaxed text-white/90 sm:mt-4 sm:text-lg md:text-xl lg:text-slate">
              Te armo tu viaje a un parque nacional: ruta día por día, equipo y presupuesto, a tu nivel. $49.
            </p>

            {/* Main CTA = quiz (starts the sales flow); FAQ link for doubts. No
                WhatsApp before purchase. The AI assistant is gated off in prod
                (VITE_CONCIERGE_ENABLED), so doubts go to the FAQ. On phones the
                FAQ link is left out to keep the photo clear; the FAQ section
                is further down the page. */}
            <div className="mt-5 flex flex-col items-start gap-1 sm:mt-8 sm:flex-row sm:items-center sm:gap-6">
              <Link
                to="/#quiz"
                onClick={() => logEvent("hero_cta_click", { cta: "quiz" })}
                className="inline-flex min-h-[48px] items-center justify-center whitespace-nowrap rounded-full bg-hero-accent px-8 py-4 text-base font-semibold text-white shadow-lg shadow-hero-accent/25 transition-colors [text-shadow:none] hover:bg-hero-accent/90"
              >
                Encuentra tu parque →
              </Link>
              <Link
                to="/#faq"
                onClick={() => logEvent("hero_cta_click", { cta: "faq" })}
                className="hidden min-h-[44px] items-center px-2 text-sm font-medium text-white underline decoration-white/50 underline-offset-4 hover:decoration-white sm:inline-flex lg:text-green lg:decoration-green/40 lg:hover:decoration-green"
              >
                ¿Dudas? Lee las preguntas frecuentes
              </Link>
            </div>

            <p className="mt-4 flex items-start gap-2 font-sans text-xs text-white/80 sm:text-sm lg:text-slate">
              <ShieldCheck className="mt-px h-4 w-4 shrink-0 lg:text-green" aria-hidden="true" />
              <span>Agente de Viajes Certificado (TAP) · Itinerario en menos de 48 h</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
