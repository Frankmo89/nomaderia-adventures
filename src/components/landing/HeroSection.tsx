import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import MediaSlider from "@/components/landing/MediaSlider";

const WHATSAPP_URL = buildWhatsAppLink(
  "Hola Frank, quiero planear mi primera aventura"
);

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden">
      <MediaSlider />

      {/* Photo-agnostic bottom scrim — top stays clean, sky/landscape breathes */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/85 via-[#1C1917]/40 to-transparent" />

      {/* Bottom-left anchored content */}
      <div className="absolute bottom-0 left-0 z-10 max-w-2xl p-8 md:p-14 lg:p-20">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif font-bold text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-shadow-hero"
        >
          Tu Concierge de Aventuras en Español
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-4 text-lg md:text-xl text-white/90 max-w-xl font-sans text-shadow-card"
        >
          Te armo tu viaje de trekking completo — itinerario, equipo, presupuesto
          — adaptado a tu nivel y tus sueños.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8"
        >
          {/* Primary — WhatsApp (existing buildWhatsAppLink logic untouched) */}
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

          {/* Secondary — ghost pill, reuses existing /destinos route */}
          <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }}>
            <Link
              to="/destinos"
              className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-sm text-white px-8 py-4 text-base font-medium hover:bg-white/20 transition-colors"
            >
              Explorar Destinos →
            </Link>
          </motion.div>
        </motion.div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-6 inline-flex items-center gap-2 bg-black/20 border border-white/20 backdrop-blur-sm rounded-full px-5 py-2.5 text-xs sm:text-sm text-white/80 font-sans shadow-editorial"
        >
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Agente de Viajes Certificado (TAP) · Respuesta en {"<"} 24h</span>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
