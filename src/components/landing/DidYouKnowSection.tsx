import { useState, useRef, useEffect } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const scrollLeft = el.scrollLeft;
      const cardWidth = el.firstElementChild?.clientWidth || 1;
      setActiveIndex(Math.round(scrollLeft / (cardWidth + 16)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const CardContent = ({ card }: { card: typeof cards[0] }) => (
    <Link
      to={`/destinos/${card.slug}`}
      className="block relative rounded-xl overflow-hidden group h-full"
    >
      <img
        src={card.image}
        alt={card.destination}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6 transition-transform duration-500 group-hover:translate-y-[-4px]">
        <p className="font-serif text-base sm:text-lg md:text-xl font-semibold text-foreground leading-snug mb-3" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
          {card.text}
        </p>
        <span className="text-sm font-sans text-primary font-medium group-hover:underline">
          {card.destination} →
        </span>
      </div>
    </Link>
  );

  return (
    <section className="py-16 sm:py-20 bg-muted relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10">
        <div className="container mx-auto px-5">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-2xl sm:text-3xl md:text-5xl font-bold text-foreground text-center mb-10 sm:mb-12"
          >
            ¿Sabías que puedes…?
          </motion.h2>
        </div>

        {/* Mobile: horizontal snap scroll */}
        <div
          ref={scrollRef}
          className="flex sm:hidden gap-4 overflow-x-auto snap-x snap-mandatory px-5 pb-4 scrollbar-hide"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {cards.map((card) => (
            <div
              key={card.slug}
              className="snap-center shrink-0"
              style={{ width: "85vw", aspectRatio: "3/4" }}
            >
              <CardContent card={card} />
            </div>
          ))}
        </div>

        {/* Mobile scroll indicators */}
        <div className="flex sm:hidden justify-center gap-2 mt-4">
          {cards.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-6 bg-primary" : "w-2 bg-foreground/20"
              }`}
            />
          ))}
        </div>

        {/* Desktop: grid */}
        <div className="container mx-auto px-5">
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {cards.map((card, i) => (
              <motion.div
                key={card.slug}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                style={{ aspectRatio: "3/4" }}
              >
                <CardContent card={card} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DidYouKnowSection;
