import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { MapPin, Pause, Play, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { logEvent } from "@/lib/events";
import { heroSlides, nextHeroSlide, type HeroSlide } from "@/lib/hero-slides";
import { HERO_RIDGES, ridgeMaskUrl, type HeroRidge } from "@/lib/hero-ridges";
import { useHeroGalleryPhotos } from "@/hooks/use-hero-gallery";
import { useScrollDepth, type DepthLayer, type ScrollDepth } from "@/hooks/use-scroll-depth";
// Kept in place per perf task: query may stay unused for display.
import { useFeaturedHeroPark } from "@/hooks/use-destinations";

/**
 * Home hero (ADR-047): the photo is the screen.
 *  - Phones and tablets: story-style. The photo fills the whole screen behind
 *    the transparent navbar and ends in a mountain range (ADR-048): far peaks,
 *    a middle range with drifting mist, then front hills with pines that the
 *    text stands on. They darken to solid forest-dark at the bottom, so the
 *    dark promise band below follows with no seam. The top stays clear except
 *    a faint shade for the white logo.
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

/* Phones: the range the photo ends in (ADR-048), flat like the /destinos
   scene: far peaks in pine green (#2F5E4A), a darker middle range (#1E3D30),
   front hills in forest-dark. Each layer is cut by its silhouette (top band)
   and solid below, and runs down behind the text, so the layers add up there
   with no seam: behind the text the photo is gone (≥ 0.99 dark).
   Effects, all off with "reduce motion": the far and middle ranges rise in on
   load and mist drifts between them. Scroll depth (parallax) comes from
   useScrollDepth in the component. */
const HERO_CSS = `
.hero-ridge {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  -webkit-mask: var(--ridge) top / 100% var(--ridge-h) no-repeat,
    linear-gradient(#000 0 0) bottom / 100% calc(100% - var(--ridge-h) + 1px) no-repeat;
  mask: var(--ridge) top / 100% var(--ridge-h) no-repeat,
    linear-gradient(#000 0 0) bottom / 100% calc(100% - var(--ridge-h) + 1px) no-repeat;
}
.hero-ridge-back { top: -7.5rem; background: rgba(47, 94, 74, 0.86); }
.hero-ridge-mid { top: -3.75rem; background: rgba(30, 61, 48, 0.95); }
.hero-ridge-front {
  top: -2rem;
  background: linear-gradient(to bottom, rgba(20, 32, 26, 0.96) 0, #14201a 3rem);
}
.hero-mist {
  position: absolute;
  left: 0;
  top: -5rem;
  width: 200%;
  height: 3.5rem;
  background-image:
    radial-gradient(ellipse 18% 42% at 14% 58%, rgba(234, 240, 236, 0.26), transparent 72%),
    radial-gradient(ellipse 14% 34% at 38% 40%, rgba(234, 240, 236, 0.18), transparent 70%),
    radial-gradient(ellipse 20% 46% at 66% 62%, rgba(234, 240, 236, 0.22), transparent 72%),
    radial-gradient(ellipse 12% 30% at 88% 44%, rgba(234, 240, 236, 0.16), transparent 70%);
  background-size: 50% 100%;
  background-repeat: repeat-x;
}
@media (prefers-reduced-motion: no-preference) {
  .hero-range { animation: hero-range-in 1.1s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .hero-ridge-mid { animation: hero-range-in 1.1s 0.12s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .hero-mist { animation: hero-mist 70s linear infinite; }
}
@keyframes hero-range-in {
  from { opacity: 0; translate: 0 28px; }
}
@keyframes hero-mist {
  to { transform: translateX(-50%); }
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

const ridgeStyle = (ridge: HeroRidge) =>
  ({ "--ridge": ridgeMaskUrl(ridge), "--ridge-h": `${ridge.height / 16}rem` }) as CSSProperties;
// Far range: Yosemite Valley, El Capitan and Half Dome (ADR-058).
const RIDGE_BACK = ridgeStyle(HERO_RIDGES.yosemite);
const RIDGE_MID = ridgeStyle(HERO_RIDGES.mid);
const RIDGE_FRONT = ridgeStyle(HERO_RIDGES.front);

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
  const photosRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  // Phones: scroll depth (ADR-049). While the hero scrolls away, the photo
  // lags at 40 % of the scroll and zooms in a little, the far range lags 16 %,
  // the middle range 7 %, and the front hills with the text move with the
  // page, so the land climbs over the photo and the near ranges over the far
  // ones. Off with "reduce motion" and from lg up (no range on desktop).
  const depthLayers = useMemo<readonly DepthLayer[]>(() => {
    const scrolled = ({ entered, viewport }: ScrollDepth) => Math.min(Math.max(entered - viewport, 0), viewport * 1.2);
    const lag = (speed: number) => (d: ScrollDepth) => `translate3d(0, ${(scrolled(d) * speed).toFixed(1)}px, 0)`;
    return [
      {
        ref: photosRef,
        transform: (d) => `${lag(0.4)(d)} scale(${(1 + (0.06 * scrolled(d)) / d.viewport).toFixed(4)})`,
      },
      { ref: rangeRef, transform: lag(0.16) },
      { ref: midRef, transform: lag(0.07) },
    ];
  }, []);
  useScrollDepth(sectionRef, depthLayers, { enabled: !reducedMotion, media: "(max-width: 1023px)" });

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
    <section ref={sectionRef} className="relative flex h-[100svh] min-h-[540px] flex-col overflow-hidden bg-forest-dark lg:block lg:h-auto lg:min-h-0 lg:overflow-visible lg:bg-cloud lg:pt-[76px]">
      <style>{HERO_CSS}</style>
      <div className="flex min-h-0 flex-1 flex-col lg:container lg:mx-auto lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16 lg:px-5 lg:py-12 xl:gap-24">
        {/* Photos. Phones: everything above the text (so the photo's middle
            shows above the mountains, not behind the text). lg+: a tall frame. */}
        <div
          ref={photosRef}
          className="relative min-h-0 flex-1 will-change-transform lg:order-2 lg:flex-none lg:will-change-auto"
        >
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
                  {/* Phones: framed at 65 % of its height, so what the
                      mountains would cover moves up into view (ADR-049). */}
                  <HeroPhoto
                    slide={slide}
                    cover={cover}
                    alt={slide.alt}
                    className="absolute inset-0 h-full w-full object-cover object-[center_65%] lg:object-center"
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
            {/* Place of the photo: under the logo on phones (like the
                location on a story), bottom-left of the frame on lg+. */}
            {current.place && (
              <p className="absolute left-5 top-[88px] inline-flex sm:top-[100px] items-center gap-1.5 rounded-full bg-forest-dark/70 px-3 py-1.5 font-condensed text-xs font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm lg:bottom-5 lg:top-auto lg:bg-forest-dark/75">
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
          {/* Phones: the mountain range the photo ends in; the text stands on
              its front hills. Anchored to the text, so it follows the copy on
              any screen height. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 lg:hidden">
            <div ref={rangeRef} className="hero-range absolute inset-0 will-change-transform">
              <div className="hero-ridge hero-ridge-back" style={RIDGE_BACK} />
              <div className="hero-mist" style={{ animationPlayState: onScreen ? "running" : "paused" }} />
            </div>
            <div ref={midRef} className="hero-ridge hero-ridge-mid will-change-transform" style={RIDGE_MID} />
            <div className="hero-ridge hero-ridge-front" style={RIDGE_FRONT} />
          </div>
          <div className="container relative mx-auto px-5 pb-10 sm:pb-14 lg:mx-0 lg:max-w-none lg:p-0 [text-shadow:0_1px_12px_rgba(20,32,26,0.5)] lg:[text-shadow:none]">
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
