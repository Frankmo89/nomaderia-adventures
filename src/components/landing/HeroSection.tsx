import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const WHATSAPP_URL = buildWhatsAppLink(
  "Hola Frank, quiero planear mi primera aventura"
);

const HERO_VIDEOS = [
  {
    video:
      "https://vrixiuvnhvqafmxlcyex.supabase.co/storage/v1/object/public/media_gallery/4e9c4d7f-3cad-4023-8e89-0e58e2167648.mp4",
    poster:
      "https://vrixiuvnhvqafmxlcyex.supabase.co/storage/v1/object/public/media_gallery/bfa161c7-c696-4d19-a1a9-4c8a8b31acc6.jpeg",
  },
  {
    video:
      "https://vrixiuvnhvqafmxlcyex.supabase.co/storage/v1/object/public/media_gallery/d25e6cfd-aba3-4770-8b77-a24a16322ce8.mp4",
    poster:
      "https://vrixiuvnhvqafmxlcyex.supabase.co/storage/v1/object/public/media_gallery/c18358ba-aecd-4a55-8c61-3e27679537c8.jpeg",
  },
] as const;

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

const MASK_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 1,
  WebkitMaskImage: "url('/hero-mask.svg')",
  maskImage: "url('/hero-mask.svg')",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
};

const SCRIM_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 10,
  background:
    "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 35%, rgba(10,25,10,0.65) 70%, rgba(10,25,10,0.88) 100%)",
};

const VIDEO_BASE_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  transition: "opacity 1.2s ease",
};

const HeroSection = () => {
  const [shouldUseVideo, setShouldUseVideo] = useState(false);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const videoRef0 = useRef<HTMLVideoElement>(null);
  const videoRef1 = useRef<HTMLVideoElement>(null);

  const getRef = (i: number) => (i === 0 ? videoRef0 : videoRef1);

  // Detect reduced-motion / saveData / slow network once on mount
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const conn = (
      navigator as Navigator & { connection?: NetworkInformation }
    ).connection;
    const saveData = conn?.saveData === true;
    const slowNet =
      conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g";
    setShouldUseVideo(!prefersReduced && !saveData && !slowNet);
  }, []);

  // Attach 'ended' listeners and kick off first clip
  useEffect(() => {
    if (!shouldUseVideo) return;

    const v0 = videoRef0.current;
    const v1 = videoRef1.current;
    if (!v0) return;

    const advance = (fromIndex: number) => {
      const next = fromIndex === 0 ? 1 : 0;
      const nextVid = getRef(next).current;
      if (!nextVid) return;
      nextVid.currentTime = 0;
      nextVid.play().catch(() => {});
      activeRef.current = next;
      setActive(next);
    };

    const handler0 = () => advance(0);
    const handler1 = () => advance(1);

    v0.addEventListener("ended", handler0);
    v1?.addEventListener("ended", handler1);
    v0.play().catch(() => {});

    return () => {
      v0.removeEventListener("ended", handler0);
      v1?.removeEventListener("ended", handler1);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldUseVideo]);

  const jumpTo = (i: number) => {
    getRef(activeRef.current).current?.pause();
    const nextVid = getRef(i).current;
    if (!nextVid) return;
    nextVid.currentTime = 0;
    nextVid.play().catch(() => {});
    activeRef.current = i;
    setActive(i);
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background layer — videos + scrim, clipped to soft mountain silhouette */}
      <div style={MASK_STYLE}>
        {shouldUseVideo ? (
          <>
            {HERO_VIDEOS.map((item, i) => (
              <video
                key={item.video}
                ref={getRef(i)}
                muted
                playsInline
                preload="metadata"
                poster={item.poster}
                aria-hidden="true"
                style={{
                  ...VIDEO_BASE_STYLE,
                  opacity: i === active ? 1 : 0,
                }}
              >
                <source src={item.video} type="video/mp4" />
              </video>
            ))}
          </>
        ) : (
          <img
            src={HERO_VIDEOS[0].poster}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* Netflix-pattern gradient scrim */}
        <div style={SCRIM_STYLE} />
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
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <span>Agente de Viajes Certificado (TAP) · Respuesta en {"<"} 24h</span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="font-serif font-bold text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-shadow-hero"
        >
          Tu Concierge de Aventuras{" "}
          <em style={{ color: "#FCD34D" }}>en Español</em>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-4 text-lg md:text-xl text-white/90 max-w-xl font-sans text-shadow-card"
        >
          Te armo tu viaje de trekking completo — itinerario, equipo, presupuesto
          — adaptado a tu nivel y tus sueños.
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
              className="rounded-full bg-primary text-primary-foreground h-auto px-8 py-4 text-base font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
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

      {/* Dot indicators — 2 dots, shown only when video is active */}
      {shouldUseVideo && (
        <div
          className="absolute right-8 flex items-center gap-2"
          style={{ zIndex: 4, bottom: "22%" }}
        >
          {HERO_VIDEOS.map((_, i) => (
            <button
              key={i}
              onClick={() => jumpTo(i)}
              aria-label={`Ir a video ${i + 1}`}
              style={{
                height: 6,
                width: i === active ? 20 : 6,
                borderRadius: 3,
                background:
                  i === active ? "#FAFAFA" : "rgba(255,255,255,0.35)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroSection;
