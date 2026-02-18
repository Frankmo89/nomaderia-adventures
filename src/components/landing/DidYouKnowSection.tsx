import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const cards = [
  {
    text: "¿Sabías que puedes caminar hasta un glaciar en el fin del mundo?",
    destination: "Ushuaia, Argentina",
    slug: "ushuaia-fin-del-mundo",
    gradient: "from-sky/30 to-secondary/30",
  },
  {
    text: "¿Sabías que puedes bajar al fondo del Gran Cañón?",
    destination: "Grand Canyon, USA",
    slug: "gran-canon",
    gradient: "from-primary/30 to-destructive/20",
  },
  {
    text: "¿Sabías que puedes llegar al campamento base del Everest sin ser alpinista?",
    destination: "Everest Base Camp, Nepal",
    slug: "everest-base-camp",
    gradient: "from-foreground/10 to-secondary/20",
  },
  {
    text: "¿Sabías que puedes caminar 800km a través de España?",
    destination: "Camino de Santiago, España",
    slug: "camino-de-santiago",
    gradient: "from-primary/20 to-accent/20",
  },
];

const DidYouKnowSection = () => {
  return (
    <section className="py-20 bg-muted">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-3xl md:text-5xl font-bold text-foreground text-center mb-12"
        >
          ¿Sabías que puedes…?
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/destinos/${card.slug}`}
                className={`block relative rounded-xl overflow-hidden bg-gradient-to-br ${card.gradient} p-8 md:p-12 min-h-[200px] hover:scale-[1.02] transition-transform duration-300 group`}
              >
                <p className="font-serif text-xl md:text-2xl font-semibold text-foreground leading-snug mb-4">
                  {card.text}
                </p>
                <span className="text-sm font-sans text-primary font-medium group-hover:underline">
                  {card.destination} →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DidYouKnowSection;
