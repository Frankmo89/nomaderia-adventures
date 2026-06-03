import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import MediaSlider from "@/components/landing/MediaSlider";

const WHATSAPP_URL = buildWhatsAppLink(
  "Hola Frank, quiero planear mi primera aventura"
);

const primaryCtaClassName =
  "rounded-full bg-primary text-primary-foreground shadow-editorial transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-editorial-hover active:translate-y-0 active:scale-[0.98] active:bg-primary/80";

const secondaryCtaClassName =
  "rounded-full border border-stone/80 bg-white/72 text-foreground/90 shadow-editorial transition-all duration-200 hover:-translate-y-0.5 hover:bg-sand hover:shadow-editorial-hover active:translate-y-0 active:scale-[0.98]";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <MediaSlider />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/78 via-[#1C1917]/34 to-transparent" />

      <div className="relative z-10 container mx-auto px-5 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-display font-bold leading-[0.92] tracking-[-0.04em] text-white mb-6 max-w-4xl mx-auto text-shadow-hero"
        >
          Tu Concierge de Aventuras
          <br />
          en Español
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-10 font-sans text-shadow-card"
        >
          Te armo tu viaje de trekking completo — itinerario, equipo, presupuesto
          — adaptado a tu nivel y tus sueños.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }} className="w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className={`text-lg px-10 h-14 w-full ${primaryCtaClassName}`}
            >
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                Plática Conmigo
              </a>
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }} className="w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              variant="outline"
              className={`text-lg px-10 h-14 w-full backdrop-blur-sm ${secondaryCtaClassName}`}
            >
              <a href="#quiz">Descubre Tu Destino Ideal →</a>
            </Button>
          </motion.div>
        </motion.div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 inline-flex items-center gap-2 bg-black/20 border border-white/20 backdrop-blur-sm rounded-full px-5 py-2.5 text-sm text-white/80 font-sans shadow-editorial"
        >
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Agente de Viajes Certificado (TAP) · Respuesta en {"<"} 24h</span>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
