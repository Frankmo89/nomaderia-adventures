import { MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { logEvent } from "@/lib/events";
// Kept in place per perf task: query may stay unused for display.
import { useFeaturedHeroPark } from "@/hooks/use-destinations";

/**
 * Home hero (ADR-045): photo on top, text below on the page's light ground.
 * No dark wash over the photo and nothing changes on its own.
 *  - Phones and tablets: the photo fills the top of the screen behind the
 *    transparent navbar and ends in a mountain crest; the text sits under it.
 *  - lg+: text on the left, the photo framed on the right. The photos are
 *    portrait (3:4), so a tall frame shows them whole. The navbar starts
 *    solid here (see hasHeroForPath).
 *
 * One photo, Frank's own (public/hero/v2/, ADR-038). To change it, move
 * HERO_PHOTO and the preload in index.html together. `place` names only the
 * park, never a trail or viewpoint we have not checked.
 */
const HERO_BASE = "/hero/v2";
const HERO_PHOTO = { id: "02", place: "Joshua Tree · California" } as const;
const HERO_WIDTHS = [640, 1080, 1600] as const;
/** Keep in sync with `imagesizes` on the index.html preload. */
const HERO_SIZES = "(min-width: 1024px) 44vw, 100vw";

function heroSrcSet(ext: "avif" | "webp"): string {
  return HERO_WIDTHS.map((w) => `${HERO_BASE}/${HERO_PHOTO.id}-${w}.${ext} ${w}w`).join(", ");
}

/* Below lg the photo ends in the same crest as before (public/hero-mask.svg),
   so the light ground under it reads as land meeting sky. */
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
`;

const HeroSection = () => {
  // Intentionally unused for display — leave the Supabase query in place.
  useFeaturedHeroPark();

  return (
    <section className="relative bg-cloud lg:pt-[76px]">
      <style>{HERO_CSS}</style>
      <div className="lg:container lg:mx-auto lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-14 lg:px-5 lg:py-14 xl:gap-20">
        {/* Photo — first in the DOM so phones show it on top. */}
        <div className="relative lg:order-2">
          <div className="hero-photo-frame relative h-[56svh] min-h-[380px] max-h-[600px] overflow-hidden lg:h-[min(72vh,680px)] lg:max-h-none lg:rounded-[2rem] lg:shadow-[0_24px_60px_-20px_rgba(20,32,26,0.35)]">
            <picture>
              <source type="image/avif" srcSet={heroSrcSet("avif")} sizes={HERO_SIZES} />
              <source type="image/webp" srcSet={heroSrcSet("webp")} sizes={HERO_SIZES} />
              <img
                src={`${HERO_BASE}/${HERO_PHOTO.id}-1080.webp`}
                alt="Un árbol de Joshua bajo cielo azul en Joshua Tree, California"
                width={1080}
                height={1440}
                decoding="sync"
                loading="eager"
                fetchPriority="high"
                className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
                style={{ filter: "saturate(1.08) contrast(1.03)" }}
              />
            </picture>
            {/* Keeps the white logo and menu readable over the sky (phones). */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-forest-dark/50 to-transparent lg:hidden"
            />
            <p className="absolute bottom-[19%] left-5 inline-flex items-center gap-1.5 rounded-full bg-forest-dark/75 px-3 py-1.5 font-condensed text-xs font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm lg:bottom-5">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {HERO_PHOTO.place}
            </p>
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
