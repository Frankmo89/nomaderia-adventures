import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Reveal from "@/components/editorial/Reveal";
import { useNewsletterSliderImages } from "@/hooks/use-newsletter-slider-images";

const UNIQUE_VIOLATION = "23505";
const SLIDE_DURATION = 5000;
const CROSSFADE_DURATION_MS = 1200;

const KEN_BURNS_CSS = `
@keyframes newsletter-ken-burns {
  from { transform: scale(1.0) translateX(0px); }
  to   { transform: scale(1.08) translateX(-12px); }
}
`;

const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [previousSlide, setPreviousSlide] = useState<number | null>(null);
  const [loadedUrls, setLoadedUrls] = useState<Record<string, true>>({});
  const { toast } = useToast();
  const {
    data: newsletterImages = [],
    isLoading: imagesLoading,
    isError: imagesError,
  } = useNewsletterSliderImages();

  const imageUrls = useMemo(
    () => newsletterImages.map((item) => item.public_url).filter(Boolean),
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
    <section className="relative overflow-hidden py-16 sm:py-20 bg-wash-to-footer">
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
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(20,32,26,0.18)_10%,rgba(20,32,26,0.68)_48%,rgba(20,32,26,0.94)_100%)]" />
        </div>
      ) : null}

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
