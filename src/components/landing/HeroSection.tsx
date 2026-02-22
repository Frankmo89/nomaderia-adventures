import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Compass, MapPin, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATS = [
  { icon: MapPin, value: "30+", label: "Destinos" },
  { icon: Users, value: "10k+", label: "Aventureros" },
  { icon: Star, value: "4.9", label: "Valoración" },
];

const HeroSection = () => {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (bgRef.current) {
        bgRef.current.style.transform = `translateY(${window.scrollY * 0.35}px) scale(1.1)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToQuiz = () => {
    document.getElementById("quiz")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center will-change-transform scale-110"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-transparent" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 container mx-auto px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-secondary/20 border border-secondary/40 backdrop-blur-sm text-secondary-foreground rounded-full px-4 py-1.5 text-sm font-sans mb-6"
        >
          <Compass className="h-4 w-4 text-secondary" />
          <span>Guías para aventureros principiantes</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
          className="font-serif text-[2rem] leading-[1.15] sm:text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-5 sm:mb-6"
          style={{ textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
        >
          Tu Primera Aventura
          <br />
          <span className="text-primary">Te Está Esperando</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="text-base sm:text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-8 sm:mb-10 font-sans"
          style={{ textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}
        >
          No necesitas ser atleta. No necesitas experiencia.
          <br className="hidden sm:block" />
          Solo necesitas decir: <em className="text-sand">yo quiero ir.</em>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
        >
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-base sm:text-lg px-8 h-12 sm:h-14 shadow-lg shadow-primary/30 w-full sm:w-auto gap-2">
            <a href="#quiz">
              <Compass />
              Descubre A Dónde Ir
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-foreground/30 text-foreground hover:bg-foreground/10 text-base sm:text-lg px-8 h-12 sm:h-14 backdrop-blur-sm w-full sm:w-auto">
            <a href="#destinos">Explorar Destinos</a>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex items-center justify-center gap-6 sm:gap-10 mt-10 sm:mt-12"
        >
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-serif font-bold text-lg sm:text-xl text-foreground" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                  {value}
                </span>
              </div>
              <span className="text-xs text-foreground/60 font-sans uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.button
        aria-label="Desplazar hacia abajo"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        onClick={scrollToQuiz}
      >
        <ChevronDown className="h-8 w-8 text-foreground/50 hover:text-foreground/80 transition-colors" />
      </motion.button>
    </section>
  );
};

export default HeroSection;
