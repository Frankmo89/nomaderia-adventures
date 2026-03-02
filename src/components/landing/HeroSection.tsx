import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import MediaSlider from "@/components/landing/MediaSlider";

const WHATSAPP_URL = buildWhatsAppUrl(
  "Hola Frank, quiero planear mi primera aventura"
);

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <MediaSlider />

      <div className="relative z-10 container mx-auto px-5 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="font-serif text-5xl md:text-7xl font-bold text-white mb-6"
          style={{ textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
        >
          Tu Concierge de Aventuras
          <br />
          en Español
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-10 font-sans"
          style={{ textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}
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
          {WHATSAPP_URL && (
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-10 h-14 shadow-lg shadow-primary/30 w-full sm:w-auto"
            >
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                Plática Conmigo
              </a>
            </Button>
          )}
          <Button
            asChild
            size="lg"
            className="bg-transparent border border-white text-white hover:bg-white/10 text-lg px-10 h-14 backdrop-blur-sm w-full sm:w-auto"
          >
            <a href="#quiz">Descubre Tu Destino Ideal →</a>
          </Button>
        </motion.div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 inline-flex items-center gap-2 bg-black/20 border border-white/20 backdrop-blur-sm rounded-full px-5 py-2.5 text-sm text-white/80 font-sans"
        >
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Agente de Viajes Certificado (TAP) · Respuesta en {"<"} 24h</span>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
