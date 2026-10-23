import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Pause, Play, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { logEvent } from "@/lib/events";
import { heroSlides, nextHeroSlide } from "@/lib/hero-slides";
import { useHeroGalleryPhotos } from "@/hooks/use-hero-gallery";
// Kept in place per perf task: query may stay unused for display.
import { useFeaturedHeroPark } from "@/hooks/use-destinations";

/**
 * Home hero (ADR-045): photos on top, text below on the page's light ground.
 * No dark wash over the photos and no progress bars.
 *  - Phones and tablets: the photos fill the top of the screen behind the
 *    transparent navbar and end in a mountain crest; the text sits under them.
 *  - lg+: text on the left, the photos framed on the right. They are
 *    portrait (3:4), so a tall frame shows them whole. The navbar starts
 *    solid here (see hasHeroForPath).
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
const HERO_SIZES = "(min-width: 1024px) 44vw, 100vw";
const SLIDE_MS = 6000;

/* Below lg the photos end in the same crest as before (public/hero-mask.svg),
   so the light ground under them reads as land meeting sky. */
const HERO_CSS = `
.hero-photo-frame {
  -webkit-mask-image: url('/hero-mask.svg');
  mask-image: url('/hero-mask.svg');
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}
@media (min-width: 1024px) {
  .hero-photo-frame { -webkit-mask-image: none; mask-image: none; }
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
    <section className="relative bg-cloud lg:pt-[76px]">
      <style>{HERO_CSS}</style>
      <div className="lg:container lg:mx-auto lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-14 lg:px-5 lg:py-14 xl:gap-20">
        {/* Photos — first in the DOM so phones show them on top. */}
        <div className="relative lg:order-2">
          <div
            ref={frameRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="hero-photo-frame relative h-[56svh] min-h-[380px] max-h-[600px] overflow-hidden bg-forest-dark lg:h-[min(72vh,680px)] lg:max-h-none lg:rounded-[2rem] lg:shadow-[0_24px_60px_-20px_rgba(20,32,26,0.35)]"
          >
            {slides.map((slide, i) => {
              const cover = i === 0;
              // Wait for the gallery list before fetching a second photo, so a
              // local one is not downloaded only to be replaced.
              const mounted =
                cover || (restReady && !galleryPending && (seen.has(slide.key) || i === safeActive || i === nextIndex));
              if (!mounted) return null;
              const shown = i === safeActive;
              const img = (
                <img
                  src={slide.src}
                  srcSet={slide.local ? undefined : slide.srcSet}
                  sizes={slide.local ? undefined : HERO_SIZES}
                  alt={slide.alt}
                  width={1080}
                  height={1440}
                  decoding={cover ? "sync" : "async"}
                  loading="eager"
                  fetchPriority={cover ? "high" : "low"}
                  className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
                  style={{ filter: "saturate(1.08) contrast(1.03)" }}
                />
              );
              return (
                <picture
                  key={slide.key}
                  aria-hidden={!shown}
                  className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
                  style={{ opacity: shown ? 1 : 0 }}
                >
                  {slide.local && <source type="image/avif" srcSet={slide.local.avif} sizes={HERO_SIZES} />}
                  {slide.local && <source type="image/webp" srcSet={slide.local.webp} sizes={HERO_SIZES} />}
                  {img}
                </picture>
              );
            })}
            {/* Keeps the white logo and menu readable over the sky (phones). */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-forest-dark/50 to-transparent lg:hidden"
            />
            {current.place && (
              <p className="absolute bottom-[19%] left-5 inline-flex items-center gap-1.5 rounded-full bg-forest-dark/75 px-3 py-1.5 font-condensed text-xs font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm lg:bottom-5">
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
                className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:bottom-[19%] focus-visible:right-5 focus-visible:z-10 focus-visible:inline-flex focus-visible:h-11 focus-visible:w-11 focus-visible:items-center focus-visible:justify-center focus-visible:rounded-full focus-visible:bg-forest-dark/80 focus-visible:text-cloud focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cloud lg:focus-visible:bottom-5"
              >
                {userPaused ? <Play className="h-5 w-5" aria-hidden="true" /> : <Pause className="h-5 w-5" aria-hidden="true" />}
              </button>
            )}
          </div>
        </div>

        {/* Text — same left edge as the navbar (`container px-5`). */}
        <div className="container mx-auto px-5 pb-12 pt-2 sm:pb-16 lg:order-1 lg:mx-0 lg:max-w-none lg:p-0">
          {/* H1 + subtitle paint with the first commit: no entrance animation
              (PR #194: LCP text waiting on Framer). */}
          <h1 className="font-serif text-[2rem] font-bold leading-[1.12] text-ink sm:text-5xl xl:text-6xl">
            <span className="block">Aquí nadie se pierde…</span>
            <em className="block text-green">nomás se encuentra.</em>
          </h1>

          <p className="mt-4 max-w-xl font-sans text-[17px] leading-relaxed text-slate sm:text-lg md:text-xl">
            Te armo tu viaje a un parque nacional: ruta día por día, equipo y presupuesto, a tu nivel. $49.
          </p>

          {/* Main CTA = quiz (starts the sales flow); FAQ link for doubts. No
              WhatsApp before purchase. The AI assistant is gated off in prod
              (VITE_CONCIERGE_ENABLED), so doubts go to the FAQ. */}
          <div className="mt-6 flex flex-col items-start gap-1 sm:mt-8 sm:flex-row sm:items-center sm:gap-6">
            <Link
              to="/#quiz"
              onClick={() => logEvent("hero_cta_click", { cta: "quiz" })}
              className="inline-flex min-h-[48px] items-center justify-center whitespace-nowrap rounded-full bg-hero-accent px-8 py-4 text-base font-semibold text-white shadow-lg shadow-hero-accent/25 transition-colors hover:bg-hero-accent/90"
            >
              Encuentra tu parque →
            </Link>
            <Link
              to="/#faq"
              onClick={() => logEvent("hero_cta_click", { cta: "faq" })}
              className="-ml-2 inline-flex min-h-[44px] items-center px-2 text-sm font-medium text-green underline decoration-green/40 underline-offset-4 hover:decoration-green sm:ml-0"
            >
              ¿Dudas? Lee las preguntas frecuentes
            </Link>
          </div>

          <p className="mt-4 flex items-start gap-2 font-sans text-xs text-slate sm:text-sm">
            <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-green" aria-hidden="true" />
            <span>Agente de Viajes Certificado (TAP) · Itinerario en menos de 48 h</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
