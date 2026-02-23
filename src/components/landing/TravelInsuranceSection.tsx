import { motion } from "framer-motion";
import { Shield, HeartPulse, Luggage, Plane, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    icon: Plane,
    title: "Cancelación de Viaje",
    desc: "Recupera tu inversión si el clima, salud o imprevistos te obligan a cambiar planes de último momento.",
  },
  {
    icon: Shield,
    title: "Cobertura 24/7",
    desc: "Asistencia en español las 24 horas, sin importar la zona horaria o lo remoto del destino.",
  },
];

const AFFILIATE_URL =
  "https://www.travelpayouts.com/click?shmarker=nomaderia&prg=safety&sys=ins";

const TravelInsuranceSection = () => {
  return (
    <section className="py-16 sm:py-24 bg-background relative overflow-hidden">
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14 max-w-3xl mx-auto"
        >
          <span className="text-accent text-sm font-semibold tracking-wider uppercase mb-3 block">
            No salgas sin esto
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Protege Tu{" "}
            <span className="text-accent">Aventura</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Muchos principiantes viajan sin seguro y un accidente en montaña puede implicar gastos médicos muy altos.
            Cotiza en segundos y viaja tranquilo con una cobertura pensada para tus aventuras.
          </p>
        </motion.div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-10 sm:mb-14 max-w-5xl mx-auto">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-card/60 border border-accent/15 hover:border-accent/30 rounded-2xl p-6 text-center transition-colors"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/15 mb-4">
                <b.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                {b.title}
              </h3>
              <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed">
                {b.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button
            asChild
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground text-base px-10 py-6 rounded-2xl font-semibold shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all"
          >
            <a
              href={AFFILIATE_URL}
              target="_blank"
              rel="noopener noreferrer sponsored"
            >
              Cotizar Mi Seguro de Viaje
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Desde $2 USD/día · Compara aseguradoras en minutos · Enlace de afiliado
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default TravelInsuranceSection;
