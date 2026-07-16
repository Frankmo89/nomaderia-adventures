import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { useFeaturedHeroPark } from "@/hooks/use-destinations";

const WHATSAPP_URL = buildWhatsAppLink(
  "Hola Frank, quiero planear mi primera aventura"
);

const SUPABASE_URL =
  "https://vrixiuvnhvqafmxlcyex.supabase.co/storage/v1/object/public/media_gallery";

const ALL_PHOTOS = [
  `${SUPABASE_URL}/00f4bec5-78fa-4416-91fd-12c8319e9d49.jpeg`,
  `${SUPABASE_URL}/0971bffa-5cc8-4d0e-8c81-27f6cd4aef7a.jpeg`,
  `${SUPABASE_URL}/2171f956-08ac-4156-9644-178aa01e241e.jpeg`,
  `${SUPABASE_URL}/349defac-d3ac-474c-a03a-ab262fb49b8f.jpeg`,
  `${SUPABASE_URL}/391bde98-0b99-4773-ad0d-f5c7e50107e4.jpeg`,
  `${SUPABASE_URL}/3a72e5c0-b2a1-485b-b3fb-bf958b815579.jpeg`,
  `${SUPABASE_URL}/3bd94287-e5c1-46f9-9e5c-1bad3b82068b.jpeg`,
  `${SUPABASE_URL}/3fdc4c24-45ab-42e8-abae-a45d4bff242a.jpeg`,
  `${SUPABASE_URL}/59e22d4c-75d0-4ab7-86b4-54774328a333.jpeg`,
  `${SUPABASE_URL}/78ca25d9-466c-4580-92ad-3d1f56d57ad2.jpeg`,
  `${SUPABASE_URL}/947b0c74-2096-46f5-b91b-62aa68f8142e.jpeg`,
  `${SUPABASE_URL}/b4a7fef0-0082-4e60-98cc-37cadf3ad004.jpeg`,
  `${SUPABASE_URL}/bfa161c7-c696-4d19-a1a9-4c8a8b31acc6.jpeg`,
  `${SUPABASE_URL}/c29ff6ac-f25b-4011-9ac7-1d31121e9e71.jpeg`,
  `${SUPABASE_URL}/feeb5de1-333e-48bc-9bbd-caff00902fcc.jpeg`,
];

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const KEN_BURNS_CSS = `
@keyframes hero-ken-burns {
  from { transform: scale(1.0) translateX(0px); }
  to   { transform: scale(1.08) translateX(-12px); }
}
`;

const SLIDE_DURATION = 5000;

const HeroSection = () => {
  const { data: heroParkData } = useFeaturedHeroPark();

  const dynamicPhotos = useMemo(() => {
    const urls = (heroParkData ?? [])
      .map((p) => p.hero_image_url)
      .filter((u): u is string => !!u);
    return urls.length > 0 ? urls : null;
  }, [heroParkData]);

  const [slides, setSlides] = useState<string[]>(() =>
    shuffled(ALL_PHOTOS).slice(0, 4)
  );
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (dynamicPhotos !== null) {
      setSlides(shuffled(dynamicPhotos));
      setActive(0);
    }
  }, [dynamicPhotos]);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => clearInterval(id);
  }, [slides.length]);

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
        {/* Photo slides — 4 stacked, crossfade via opacity */}
        {slides.map((photo, i) => (
          <div
            key={photo}
            aria-hidden={i !== active}
            style={{
              position: "absolute",
              inset: 0,
              opacity: i === active ? 1 : 0,
              transition: "opacity 1.2s ease",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${photo})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                animation: "hero-ken-burns 8s ease-in-out infinite alternate",
                animationDelay: `${i * -2}s`,
              }}
            />
          </div>
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
                Plática Conmigo
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

      {/* Dot indicators — right, kept above the clipped curve */}
      <div
        className="absolute right-8 flex items-center gap-2"
        style={{ zIndex: 4, bottom: "22%" }}
      >
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Ir a foto ${i + 1}`}
            style={{
              height: 6,
              width: i === active ? 20 : 6,
              borderRadius: 3,
              background: i === active ? "#FAFAFA" : "rgba(255,255,255,0.35)",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
