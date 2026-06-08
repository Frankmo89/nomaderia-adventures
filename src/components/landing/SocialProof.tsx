import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { MapPin, BookOpen, Clock, ShieldCheck } from "lucide-react";
import { usePublicStats } from "@/hooks/use-public-stats";
import { PRICING } from "@/config/pricing";

const BG_URL =
  "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80";

const FILL_D =
  "M0,90 L0,55 L60,30 L120,50 L180,15 L240,40 L300,8 L360,35 L420,18 L480,42 L540,22 L600,45 L640,28 L680,38 L680,90 Z";

const STROKE_D =
  "M0,55 L60,30 L120,50 L180,15 L240,40 L300,8 L360,35 L420,18 L480,42 L540,22 L600,45 L640,28 L680,38";

const glassStyle: React.CSSProperties = {
  background: "rgba(5,30,15,0.65)",
  border: "1px solid rgba(110,231,183,0.25)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const SocialProof = () => {
  const { data: stats, isLoading } = usePublicStats();
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(svgWrapRef, { once: true });
  const reduced = useReducedMotion();

  if (isLoading) return null;

  const destCount = stats?.destinations ?? 0;
  const guideCount = stats?.blogPosts ?? 0;

  const STAT_CARDS = [
    { Icon: MapPin,      value: String(destCount),             label: "Destinos cubiertos con guía completa" },
    { Icon: BookOpen,    value: String(guideCount),            label: "Guías escritas en español de verdad" },
    { Icon: Clock,       value: "24h",                         label: "Tiempo máximo de entrega del itinerario" },
    { Icon: ShieldCheck, value: `$${PRICING.solucionCompleta}`, label: "Precio único, todo incluido, sin sorpresas" },
  ];

  const strokeOffset = reduced || inView ? 0 : 1200;

  return (
    <section className="relative overflow-hidden" style={{ minHeight: 560 }}>
      {/* CSS keyframe for background pan */}
      <style>{`
        @keyframes trust-pan {
          from { background-position: center 40%; }
          to   { background-position: center 60%; }
        }
        .trust-bg { animation: trust-pan 20s ease-in-out infinite alternate; }
      `}</style>

      {/* Photo background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover trust-bg"
        style={{ backgroundImage: `url(${BG_URL})` }}
      />

      {/* Dark green overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,40,20,0.78), rgba(5,30,15,0.88))",
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-5 py-20 sm:py-28">

        {/* Label */}
        <p
          className="text-xs tracking-[0.25em] uppercase font-semibold mb-5 text-center"
          style={{ color: "#6EE7B7" }}
        >
          RESPALDADO POR DATOS REALES
        </p>

        {/* Narrative */}
        <p
          className="text-center max-w-2xl mx-auto mb-14 leading-relaxed"
          style={{
            fontFamily: "Georgia, 'Playfair Display', serif",
            fontSize: "20px",
            color: "#ECFDF5",
          }}
        >
          Desde 2024, llevamos a{" "}
          <em style={{ color: "#FCD34D", fontStyle: "italic" }}>
            hispanos residentes en EE.UU.
          </em>{" "}
          a sus primeras aventuras en los parques nacionales — en español, sin suposiciones.
        </p>

        {/* Stats grid 2×2 */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto mb-10">
          {STAT_CARDS.map(({ Icon, value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="rounded-2xl p-6 text-center"
              style={glassStyle}
            >
              <Icon
                className="mx-auto mb-3 h-6 w-6"
                style={{ color: "#6EE7B7" }}
              />
              <p
                className="font-serif text-3xl sm:text-4xl font-bold mb-1"
                style={{ color: "#ECFDF5" }}
              >
                {value}
              </p>
              <p className="text-xs sm:text-sm leading-snug" style={{ color: "#A7F3D0" }}>
                {label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* TAP badge strip */}
        <div
          className="max-w-2xl mx-auto pt-8 flex flex-col sm:flex-row items-center gap-4"
          style={{ borderTop: "1px solid rgba(110,231,183,0.2)" }}
        >
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-3 shrink-0"
            style={glassStyle}
          >
            <ShieldCheck className="h-6 w-6 shrink-0" style={{ color: "#6EE7B7" }} />
            <div className="text-left">
              <p className="text-xs font-semibold leading-tight" style={{ color: "#ECFDF5" }}>
                Certificación TAP
              </p>
              <p className="text-xs leading-tight" style={{ color: "#A7F3D0" }}>
                The Travel Institute, EE.UU.
              </p>
            </div>
          </div>

          <p className="text-sm text-center sm:text-left" style={{ color: "#A7F3D0" }}>
            Agente de viajes certificado — no somos un blog ni una app genérica.
            Servicio profesional en español.
          </p>
        </div>
      </div>

      {/* Mountain SVG draw-on — triggered by inView */}
      <div ref={svgWrapRef} className="absolute bottom-0 left-0 w-full pointer-events-none">
        <svg
          viewBox="0 0 680 90"
          preserveAspectRatio="none"
          className="w-full"
          style={{ display: "block" }}
          aria-hidden="true"
        >
          {/* Fill fades in once stroke animation completes */}
          <motion.path
            d={FILL_D}
            fill="rgba(5,30,15,0.7)"
            stroke="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: inView ? 1 : 0 }}
            transition={{ delay: reduced ? 0 : 2.8, duration: 0.6 }}
          />
          {/* Stroke draw-on */}
          <motion.path
            d={STROKE_D}
            fill="none"
            stroke="rgba(110,231,183,0.5)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={1200}
            initial={{ strokeDashoffset: 1200 }}
            animate={{ strokeDashoffset: strokeOffset }}
            transition={{ duration: 2.8, ease: "easeOut" }}
          />
        </svg>
      </div>
    </section>
  );
};

export default SocialProof;
