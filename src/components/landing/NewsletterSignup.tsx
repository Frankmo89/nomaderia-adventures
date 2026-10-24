import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Reveal from "@/components/editorial/Reveal";
import {
  useNewsletterSliderImages,
  type NewsletterSliderImage,
} from "@/hooks/use-newsletter-slider-images";
import { resizedImageUrl } from "@/lib/resized-image";
import { cn } from "@/lib/utils";

const UNIQUE_VIOLATION = "23505";
const SLIDE_DURATION = 5000;
const CROSSFADE_DURATION_MS = 1200;
const EMPTY_IMAGES: NewsletterSliderImage[] = [];

const KEN_BURNS_CSS = `
@keyframes newsletter-ken-burns {
  from { transform: scale(1.0) translateX(0px); }
  to   { transform: scale(1.08) translateX(-12px); }
}
.newsletter-star { position: absolute; border-radius: 9999px; background: #eaf0ec; }
@media (prefers-reduced-motion: no-preference) {
  .newsletter-star { animation: newsletter-twinkle 3.6s ease-in-out infinite; }
  .newsletter-paused .newsletter-star { animation-play-state: paused; }
}
@keyframes newsletter-twinkle { 0%, 100% { opacity: var(--o); } 50% { opacity: calc(var(--o) * 0.35); } }
`;

/* The newsletter is where night begins (ADR-056): the photo melts into the
   night sky of the camp below, and the first stars come out under the form.
   The top edge is a wave of the blog section's cream. */
const STARS = Array.from({ length: 22 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  // Mostly in the dark lower part, fainter higher up.
  const top = 55 + r(1) * 43;
  return { left: r(2) * 100, top, size: r(3) > 0.8 ? 2.5 : 1.5, o: 0.35 + 0.55 * ((top - 55) / 43), delay: r(4) * 4 };
});
const TOP_WAVE =
  "M0,0 L400,0 L400,16 C370,26 336,22 300,18 C262,14 232,28 198,26 C166,24 150,10 112,12 C74,14 40,28 0,20 Z";

const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [previousSlide, setPreviousSlide] = useState<number | null>(null);
  const [loadedUrls, setLoadedUrls] = useState<Record<string, true>>({});
  const { toast } = useToast();
  const sectionRef = useRef<HTMLElement>(null);
  // The stars twinkle only while the section is on screen.
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const {
    data: newsletterImages = EMPTY_IMAGES,
    isLoading: imagesLoading,
    isError: imagesError,
  } = useNewsletterSliderImages();

  const imageUrls = useMemo(
    () =>
      newsletterImages
        .map((item) => resizedImageUrl(item.public_url, 1080))
        .filter(Boolean),
    [newsletterImages]
  );
  const hasPhotoBackground = !imagesLoading && !imagesError && imageUrls.length > 0;

  const nextSlide =
    imageUrls.length > 0 ? (activeSlide + 1) % imageUrls.length : 0;

  useEffect(() => {
    setActiveSlide(0);
    setPreviousSlide(null);
    setLoadedUrls({});
  }, [imageUrls]);

  useEffect(() => {
    if (!hasPhotoBackground) return;
    const toPreload = [imageUrls[activeSlide], imageUrls[nextSlide]].filter(Boolean);
    toPreload.forEach((url) => {
      if (loadedUrls[url]) return;
      const img = new Image();
      img.onload = () => {
        setLoadedUrls((prev) => (prev[url] ? prev : { ...prev, [url]: true }));
      };
      img.src = url;
      if (img.complete) {
        setLoadedUrls((prev) => (prev[url] ? prev : { ...prev, [url]: true }));
      }
    });
  }, [activeSlide, hasPhotoBackground, imageUrls, loadedUrls, nextSlide]);

  useEffect(() => {
    if (!hasPhotoBackground || imageUrls.length < 2) return;
    const timer = window.setTimeout(() => {
      setPreviousSlide(activeSlide);
      setActiveSlide((activeSlide + 1) % imageUrls.length);
    }, SLIDE_DURATION);
    return () => window.clearTimeout(timer);
  }, [activeSlide, hasPhotoBackground, imageUrls.length]);

  useEffect(() => {
    if (previousSlide === null) return;
    const timer = window.setTimeout(() => {
      setPreviousSlide(null);
    }, CROSSFADE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [previousSlide]);

  const visibleSlides = useMemo(() => {
    const indices = [activeSlide, previousSlide].filter(
      (index): index is number => index !== null
    );
    return Array.from(new Set(indices));
  }, [activeSlide, previousSlide]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email, source: "footer" });
      if (error && error.code !== UNIQUE_VIOLATION) {
        // 23505 = unique_violation (already subscribed — treat as success)
        throw error;
      }
      setDone(true);
      toast({ title: "¡Bienvenido/a! 🎉", description: "Te enviamos aventuras cada semana." });
      // Fire welcome email only for genuinely new subscriptions — non-blocking
      if (!error) {
        supabase.functions
          .invoke("send-welcome-email", { body: { email } })
          .catch(() => undefined);
      }
    } catch {
      toast({ title: "Error", description: "Intenta de nuevo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative overflow-hidden bg-[linear-gradient(to_bottom,#2F5E4A_0%,#1E3D30_45%,#14201A_100%)] pb-32 pt-24 sm:pb-36 sm:pt-28",
        !onScreen && "newsletter-paused",
      )}
    >
      <style>{KEN_BURNS_CSS}</style>

      {hasPhotoBackground ? (
        <div className="absolute inset-0 z-0" aria-hidden>
          {visibleSlides.map((index) => {
            const url = imageUrls[index];
            if (!url || !loadedUrls[url]) return null;
            const isActive = index === activeSlide;
            return (
              <div
                key={`${url}-${isActive ? "active" : "previous"}`}
                className="absolute inset-0"
                style={{
                  opacity: isActive ? 1 : 0,
                  transition: `opacity ${CROSSFADE_DURATION_MS}ms ease`,
                }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${url})`,
                    animation: "newsletter-ken-burns 8s ease-in-out infinite alternate",
                    animationDelay: `${index * -2}s`,
                  }}
                />
              </div>
            );
          })}
          {/* The photo melts into the night sky of the camp below: solid forest-dark at the bottom, no seam. */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(20,32,26,0.22)_0%,rgba(20,32,26,0.6)_42%,rgba(20,32,26,0.9)_70%,#14201A_90%)]" />
        </div>
      ) : null}

      {/* The first stars of the night, under the form. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="newsletter-star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              opacity: s.o,
              animationDelay: `${s.delay}s`,
              ["--o" as string]: s.o.toFixed(2),
            }}
          />
        ))}
      </div>
      {/* The blog section's cream comes down in a wave over the top of the photo. */}
      <svg
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 w-full sm:h-14"
        focusable="false"
      >
        <path d={TOP_WAVE} fill="#FFFBEB" />
      </svg>

      <div className="container relative z-10 mx-auto px-5 max-w-xl text-center">
        <Reveal className="mb-6 sm:mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
            Cada Semana Una Aventura Nueva En Tu Inbox
          </h2>
          <p className="text-cloud mb-2 text-sm sm:text-base">
            Únete a nuestra comunidad de aventureros 🌎
          </p>
          <p className="text-cloud text-xs sm:text-sm opacity-80">
            Tips, destinos secretos, y ofertas de equipo. Sin spam, lo prometemos.
          </p>
        </Reveal>

        {done ? (
          <p className="text-green font-medium text-base sm:text-lg">¡Gracias! Te mantendremos al tanto 🏔️</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background text-foreground h-12 text-base"
            />
            <Button type="submit" disabled={loading} className="bg-green hover:bg-green-dark text-white whitespace-nowrap h-12 text-base">
              {loading ? "..." : "Suscribirme"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
};

export default NewsletterSignup;
