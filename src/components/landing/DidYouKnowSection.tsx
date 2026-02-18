import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const cards = [
  {
    text: "¿Sabías que puedes caminar hasta un glaciar en el fin del mundo?",
    destination: "Ushuaia, Argentina",
    slug: "ushuaia-fin-del-mundo",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
  },
  {
    text: "¿Sabías que puedes bajar al fondo del Gran Cañón?",
    destination: "Grand Canyon, USA",
    slug: "gran-canon",
    image: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80",
  },
  {
    text: "¿Sabías que puedes llegar al campamento base del Everest sin ser alpinista?",
    destination: "Everest Base Camp, Nepal",
    slug: "everest-base-camp",
    image: "https://images.unsplash.com/photo-1486911278844-a81c5267e227?w=800&q=80",
  },
  {
    text: "¿Sabías que puedes caminar 800km a través de España?",
    destination: "Camino de Santiago, España",
    slug: "camino-de-santiago",
    image: "https://images.unsplash.com/photo-1543699565-003b8adda5fc?w=800&q=80",
  },
];

const DidYouKnowSection = () => {
  return (
    <section className="py-20 bg-muted relative overflow-hidden">
      {/* Grain texture */}
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
          ¿Sabías que puedes…?
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card, i) => (
            <motion.div
              key={card.slug}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <Link
                to={`/destinos/${card.slug}`}
                className="block relative rounded-xl overflow-hidden group"
                style={{ aspectRatio: "3/4" }}
              >
                {/* Background image */}
                <img
                  src={card.image}
                  alt={card.destination}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

                {/* Text content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 transition-transform duration-500 group-hover:translate-y-[-4px]">
                  <p className="font-serif text-lg md:text-xl font-semibold text-foreground leading-snug mb-3" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                    {card.text}
                  </p>
                  <span className="text-sm font-sans text-primary font-medium group-hover:underline">
                    {card.destination} →
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DidYouKnowSection;
