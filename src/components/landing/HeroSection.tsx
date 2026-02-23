import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Compass, MapPin, Mountain, Shield, Star, Sunrise, TreePine, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATS = [
  { icon: MapPin, value: "30+", label: "Destinos" },
  { icon: Users, value: "10k+", label: "Aventureros" },
  { icon: Star, value: "4.9", label: "Valoración" },
  { icon: Shield, value: "100%", label: "Seguro" },
];

const ROTATING_PHRASES = [
  "yo quiero ir.",
  "esta vez sí voy.",
  "me lo merezco.",
  "vamos a explorar.",
];

const FLOATING_ICONS = [
  { Icon: Mountain, top: "18%", left: "8%", size: "h-5 w-5 sm:h-6 sm:w-6", delay: 0, duration: 7 },
  { Icon: TreePine, top: "28%", right: "10%", size: "h-4 w-4 sm:h-5 sm:w-5", delay: 1.5, duration: 8 },
  { Icon: Sunrise, top: "65%", left: "6%", size: "h-4 w-4 sm:h-5 sm:w-5", delay: 3, duration: 6 },
  { Icon: Compass, top: "60%", right: "7%", size: "h-5 w-5 sm:h-6 sm:w-6", delay: 2, duration: 9 },
];

const HeroSection = () => {
  const bgRef = useRef<HTMLDivElement>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      if (bgRef.current) {
        bgRef.current.style.transform = `translateY(${window.scrollY * 0.35}px) scale(1.1)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % ROTATING_PHRASES.length);
    }, 3000);
    return () => clearInterval(interval);
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

      {/* Floating decorative icons */}
      {FLOATING_ICONS.map(({ Icon, top, left, right, size, delay, duration }, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none hidden sm:block"
          style={{ top, left, right }}
          animate={{ y: [-8, 8, -8], opacity: [0.12, 0.22, 0.12] }}
          transition={{ repeat: Infinity, duration, delay, ease: "easeInOut" }}
        >
          <Icon className={`${size} text-foreground/15`} />
        </motion.div>
      ))}

      {/* Glow effect behind heading */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] sm:w-[800px] sm:h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(232,108,58,0.12) 0%, transparent 70%)",
        }}
      />

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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="text-base sm:text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-8 sm:mb-10 font-sans"
          style={{ textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}
        >
          <span>No necesitas ser atleta. No necesitas experiencia.</span>
          <br className="hidden sm:block" />
          <span>Solo necesitas decir: </span>
          <span className="inline-block relative h-[1.5em] align-bottom min-w-[140px] sm:min-w-[180px]">
            <AnimatePresence mode="wait">
              <motion.em
                key={phraseIndex}
                className="text-sand absolute left-0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                {ROTATING_PHRASES[phraseIndex]}
              </motion.em>
            </AnimatePresence>
          </span>
        </motion.div>

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

        {/* Enhanced stats bar with glass effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-10 sm:mt-14 inline-flex items-center gap-0 bg-foreground/[0.06] backdrop-blur-md border border-foreground/10 rounded-2xl px-4 py-3 sm:px-6 sm:py-4"
        >
          {STATS.map(({ icon: Icon, value, label }, idx) => (
            <div key={label} className="flex items-center">
              {idx > 0 && (
                <div className="w-px h-8 bg-foreground/10 mx-3 sm:mx-5" />
              )}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 + idx * 0.1 }}
                className="flex flex-col items-center gap-0.5"
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-primary" />
                  <span
                    className="font-serif font-bold text-lg sm:text-xl text-foreground"
                    style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
                  >
                    {value}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-foreground/60 font-sans uppercase tracking-wider">
                  {label}
                </span>
              </motion.div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Improved scroll indicator — pill/mouse shape */}
      <motion.button
        aria-label="Desplazar hacia abajo"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        onClick={scrollToQuiz}
      >
        <div className="w-6 h-10 rounded-full border-2 border-foreground/30 flex items-start justify-center p-1.5">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          />
        </div>
        <ChevronDown className="h-4 w-4 text-foreground/40" />
      </motion.button>
    </section>
  );
};

export default HeroSection;
