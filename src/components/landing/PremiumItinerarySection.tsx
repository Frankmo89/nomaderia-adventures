import { motion } from "framer-motion";
import { Gauge, Ticket, Footprints, Globe } from "lucide-react";
import Reveal from "@/components/editorial/Reveal";

const benefits = [
  {
    icon: Gauge,
    title: "Dificultad Honesta",
    desc: "Te decimos exactamente qué forma física necesitas. Sin subestimar el reto ni exagerarlo para venderte el servicio.",
  },
  {
    icon: Ticket,
    title: "Permisos Sin Estrés",
    desc: "Te guiamos paso a paso en Recreation.gov antes de que se agoten los cupos — Yosemite, Half Dome y más.",
  },
  {
    icon: Footprints,
    title: "Hecho para Principiantes",
    desc: "Nunca asumimos que ya sabes. Cada guía parte de cero, sin jerga de mochilero experto.",
  },
  {
    icon: Globe,
    title: "En Español de Verdad",
    desc: "No es traducción automática. Explicamos permisos, trails y tarifas con los términos reales de los parques.",
  },
];

const PremiumItinerarySection = () => {
  return (
    <section className="section-editorial relative overflow-hidden bg-wash-clay section-recessed">
      {/* Background texture */}
      <div className="absolute inset-0 bg-secondary/5" />
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, hsl(var(--secondary) / 0.08) 0%, transparent 60%), radial-gradient(circle at 80% 20%, hsl(var(--trail) / 0.06) 0%, transparent 50%)" }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <Reveal className="text-center mb-6">
            <span className="text-xs tracking-[0.2em] uppercase font-medium text-secondary block">
              ✦ Diseño 100% Personalizado
            </span>
          </Reveal>

          {/* Heading */}
          <Reveal className="text-center mb-4">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Tu Aventura,{" "}
              <span className="text-secondary">Tu Medida</span>
            </h2>
          </Reveal>

          <Reveal className="text-center text-foreground/70 text-lg max-w-[42rem] mx-auto mb-16 leading-relaxed">
            Diseñamos tu itinerario de trekking desde cero, adaptado a tu nivel, presupuesto y objetivos.
            Sin plantillas genéricas. Sin rutas de turista.
          </Reveal>

          {/* Benefits grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-4 p-5 rounded-2xl bg-card/60 border border-secondary/15 hover:border-secondary/30 transition-colors"
              >
                <div className="shrink-0 p-2.5 rounded-xl bg-secondary/15">
                  <b.icon className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">{b.title}</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default PremiumItinerarySection;
