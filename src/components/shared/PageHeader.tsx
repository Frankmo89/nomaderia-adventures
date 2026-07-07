import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

// Color-block header band for content-listing pages that have no photo hero
// (Destinos, Blog, Guía de Equipo, Sobre Nosotros). Design System §2/§3:
// forest-dark surface, Playfair headline, Inter subtitle. See pending-tasks.md
// (Mobbin research: "peso visual" sin mapa vía tipografía oversized + bloque
// de color, en vez de mapa ilustrado estático).
// `children` renders as an absolutely-positioned background layer behind the
// headline (see USStateTintMap on Destinos) — pages that don't pass children
// render exactly as before.
const PageHeader = ({ title, subtitle, children }: PageHeaderProps) => {
  return (
    <section className="relative overflow-hidden bg-forest-dark pt-28 pb-14 sm:pt-36 sm:pb-20">
      {children}
      <div className="container relative z-10 mx-auto px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-cloud"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <p className="text-mist/90 mt-3 text-sm sm:text-base max-w-xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
};

export default PageHeader;
