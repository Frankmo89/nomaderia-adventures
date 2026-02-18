import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Nunca había acampado en mi vida. Nomaderia me dio la confianza para ir a Yosemite. Fue el mejor fin de semana de mi vida.",
    name: "María",
    age: 32,
  },
  {
    quote: "Pensé que necesitaba ser atleta para hacer el Camino de Santiago. Resulta que solo necesitaba buenos zapatos y ganas.",
    name: "Carlos",
    age: 45,
  },
  {
    quote: "Mi esposa y yo buscábamos algo diferente para vacaciones. Bajamos al Gran Cañón y fue transformador.",
    name: "Roberto",
    age: 38,
  },
];

const SocialProof = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
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
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-8 shadow-lg"
            >
              <Quote className="h-8 w-8 text-primary/40 mb-4" />
              <p className="text-card-foreground text-base leading-relaxed mb-6 italic">
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
