import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Mountain } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
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
// `eyebrow` reuses the site's established Oswald label treatment (see
// SocialProof/BlogPreview/GearPreview: font-condensed text-xs tracking-[0.08em]
// uppercase) but in `text-mist` instead of `text-green` — green measures
// ~2.7:1 against forest-dark (fails WCAG), mist measures ~14.5:1, matching
// this component's own subtitle color on the same dark surface.
const PageHeader = ({ title, subtitle, eyebrow, children }: PageHeaderProps) => {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-forest-dark pb-14 sm:pb-20",
        // `children` (USStateTintMap on Destinos) renders as an absolute layer
        // starting below the fixed navbar (see its own top-16 offset) — extra
        // top padding here gives it enough section height to render fully
        // visible instead of being squeezed/clipped against that offset.
        children ? "pt-36 sm:pt-44" : "pt-28 sm:pt-36"
      )}
    >
      {children}
      <div className="container relative z-10 mx-auto px-4 text-center">
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center gap-1.5 font-condensed text-xs tracking-[0.08em] uppercase font-semibold text-mist mb-3"
          >
            <Mountain className="h-3.5 w-3.5" />
            {eyebrow}
          </motion.p>
        )}
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
