import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient — replace with real hero image */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-forest to-background" />
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6"
        >
          Tu Primera Aventura
          <br />
          <span className="text-primary">Te Está Esperando</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-10 font-sans"
        >
          No necesitas ser atleta. No necesitas experiencia.
          <br className="hidden sm:block" />
          Solo necesitas decir: <em className="text-sand">yo quiero ir.</em>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6">
            <a href="#quiz">Descubre A Dónde Ir →</a>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-foreground/30 text-foreground hover:bg-foreground/10 text-lg px-8 py-6">
            <a href="#destinos">Explorar Destinos</a>
          </Button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <ChevronDown className="h-8 w-8 text-foreground/50" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
