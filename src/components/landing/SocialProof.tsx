import { motion } from "framer-motion";
import { MapPin, BookOpen, Clock, ShieldCheck } from "lucide-react";
import { usePublicStats } from "@/hooks/use-public-stats";
import { PRICING } from "@/config/pricing";

const SocialProof = () => {
  const { data: stats, isLoading } = usePublicStats();

  if (isLoading) return null;

  const destCount = stats?.destinations ?? 0;
  const guideCount = stats?.blogPosts ?? 0;

  const STAT_CARDS = [
    { Icon: MapPin,      value: String(destCount),             label: "Destinos cubiertos con guía completa" },
    { Icon: BookOpen,    value: String(guideCount),            label: "Guías escritas en español de verdad" },
    { Icon: Clock,       value: "24h",                         label: "Tiempo máximo de entrega del itinerario" },
    { Icon: ShieldCheck, value: `$${PRICING.solucionCompleta}`, label: "Precio único, todo incluido, sin sorpresas" },
  ];

  return (
    <section className="relative overflow-hidden bg-cloud" style={{ minHeight: 560 }}>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-5 py-20 sm:py-28">

        {/* Label */}
        <p className="font-condensed text-xs tracking-[0.08em] uppercase font-semibold mb-5 text-center text-green">
          RESPALDADO POR DATOS REALES
        </p>

        {/* Narrative */}
        <p className="text-center max-w-2xl mx-auto mb-14 leading-relaxed font-serif text-xl text-ink">
          Desde 2024, llevamos a{" "}
          <em className="text-green">
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
              className="rounded-2xl p-6 text-center bg-white border border-stone"
            >
              <Icon className="mx-auto mb-3 h-6 w-6 text-green" />
              <p className="font-serif text-3xl sm:text-4xl font-bold mb-1 text-ink">
                {value}
              </p>
              <p className="text-xs sm:text-sm leading-snug text-sage">
                {label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* TAP badge strip */}
        <div
          className="max-w-2xl mx-auto pt-8 border-t border-stone/50 flex flex-col sm:flex-row items-center gap-4"
        >
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-3 shrink-0 bg-forest-dark"
          >
            <ShieldCheck className="h-6 w-6 shrink-0 text-cloud" />
            <div className="text-left">
              <p className="text-xs font-semibold leading-tight text-cloud">
                Certificación TAP
              </p>
              <p className="text-xs leading-tight text-cloud">
                The Travel Institute, EE.UU.
              </p>
            </div>
          </div>

          <p className="text-sm text-center sm:text-left text-sage">
            Agente de viajes certificado — no somos un blog ni una app genérica.
            Servicio profesional en español.
          </p>
        </div>
      </div>

    </section>
  );
};

export default SocialProof;
