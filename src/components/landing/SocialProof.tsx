import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "Nunca había acampado en mi vida. Nomaderia me dio la confianza para ir a Yosemite. Fue el mejor fin de semana de mi vida.",
    name: "María",
    age: 32,
    initials: "MR",
    gradient: "from-primary to-secondary",
  },
  {
    quote: "Pensé que necesitaba ser atleta para hacer el Camino de Santiago. Resulta que solo necesitaba buenos zapatos y ganas.",
    name: "Carlos",
    age: 45,
    initials: "CA",
    gradient: "from-secondary to-accent",
  },
  {
    quote: "Mi esposa y yo buscábamos algo diferente para vacaciones. Bajamos al Gran Cañón y fue transformador.",
    name: "Roberto",
    age: 38,
    initials: "RO",
    gradient: "from-accent to-primary",
  },
];

const SocialProof = () => {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Faded landscape parallax */}
      <div className="absolute inset-0 opacity-[0.04] bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=60)` }} />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
      }} />

      <div className="container mx-auto px-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-3xl md:text-5xl font-bold text-foreground text-center mb-12"
        >
          De "No Puedo" a "Lo Hice"
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="bg-card rounded-xl p-8 shadow-lg relative"
            >
              {/* Large decorative quote mark */}
              <span className="absolute top-4 right-6 font-serif text-8xl text-primary/20 leading-none select-none pointer-events-none">"</span>
              <span className="absolute bottom-4 left-6 font-serif text-8xl text-primary/20 leading-none select-none pointer-events-none rotate-180">"</span>

              {/* Circular gradient avatar */}
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-5 shadow-lg ring-2 ring-background`}>
                <span className="text-base font-bold text-foreground">{t.initials}</span>
              </div>

              <p className="text-card-foreground text-base leading-relaxed mb-6 italic relative z-10">
                "{t.quote}"
              </p>
              <p className="text-sm font-semibold text-card-foreground">
                — {t.name}, {t.age}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
