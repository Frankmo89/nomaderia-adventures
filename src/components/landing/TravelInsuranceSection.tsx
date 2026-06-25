import { motion } from "framer-motion";
import { Shield, HeartPulse, Luggage, Info } from "lucide-react";
import Reveal from "@/components/editorial/Reveal";

const benefits = [
  {
    icon: HeartPulse,
    title: "Emergencias Médicas",
    desc: "Evacuación en helicóptero, hospitalización y atención médica en cualquier montaña o sendero remoto.",
  },
  {
    icon: Luggage,
    title: "Protección de Equipo",
    desc: "Tu mochila, botas y cámara están cubiertos ante pérdida, robo o daño durante toda tu aventura.",
  },
  {
    icon: Shield,
    title: "Cobertura 24/7",
    desc: "Asistencia en español las 24 horas, sin importar la zona horaria o lo remoto del destino.",
  },
];

const TravelInsuranceSection = () => {
  return (
    <section className="py-16 sm:py-24 bg-wash-forest relative overflow-hidden">
      {/* Accent gradient */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 70% 30%, hsl(var(--accent) / 0.08) 0%, transparent 55%), radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.06) 0%, transparent 50%)",
        }}
      />

      <div className="container mx-auto px-5 relative z-10">
        {/* Header */}
        <Reveal className="text-center mb-10 sm:mb-14 max-w-3xl mx-auto">
          <span className="text-secondary text-sm font-semibold tracking-wider uppercase mb-3 block">
            Antes de salir
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Protege Tu{" "}
            <span className="text-[#D97706]">Aventura</span>
          </h2>
          <p className="text-foreground/75 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Antes de salir, considera un seguro de viaje: protege tu salud, tu equipo y tu tranquilidad en cualquier aventura.
          </p>
        </Reveal>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-10 max-w-4xl mx-auto">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-card/80 border border-stone/70 hover:border-stone rounded-2xl p-6 text-center transition-colors"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#D97706]/15 mb-4">
                <b.icon className="h-6 w-6 text-[#D97706]" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                {b.title}
              </h3>
              <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                {b.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <Reveal className="flex items-start gap-2 justify-center text-sm text-foreground/55 max-w-xl mx-auto">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-foreground/35" />
          <p>El seguro de viaje está incluido en tu Itinerario Completo — te ayudamos a conseguirlo.</p>
        </Reveal>
      </div>
    </section>
  );
};

export default TravelInsuranceSection;
