import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Mountain } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: ReactNode;
  /** Controls under the subtitle, such as the park search on Destinos. */
  actions?: ReactNode;
}

// Color-block header band for content-listing pages that have no photo hero
// (Destinos, Blog, Guía de Equipo, Sobre Nosotros). Design System §2/§3:
// forest-dark surface, Playfair headline, Inter subtitle. See pending-tasks.md
// (Mobbin research: "peso visual" sin mapa vía tipografía oversized + bloque
// de color, en vez de mapa ilustrado estático).
// `children` renders as an absolutely-positioned background layer behind the
// headline (see ParkTrailScene on Destinos) — pages that don't pass children
// render exactly as before.
// `eyebrow` reuses the site's established Oswald label treatment (see
// SocialProof/BlogPreview/GearPreview: font-condensed text-xs tracking-[0.08em]
// uppercase) but in `text-mist` instead of `text-green` — green measures
// ~2.7:1 against forest-dark (fails WCAG), mist measures ~14.5:1, matching
// this component's own subtitle color on the same dark surface.
const PageHeader = ({ title, subtitle, eyebrow, children, actions }: PageHeaderProps) => {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-forest-dark",
        // With `children` (ParkTrailScene on Destinos) the headline sits just
        // under the fixed navbar and the bottom padding leaves room for the
        // scene, whose tallest shapes stop below the last line (subtitle or
        // `actions`): they reach 116px on phones, 142px from 640px up (ADR-043).
        children ? "pt-[100px] pb-32 sm:pt-32 sm:pb-40" : "pt-28 sm:pt-36 pb-14 sm:pb-20"
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
        {actions && <div className="mt-5 sm:mt-6">{actions}</div>}
      </div>
    </section>
  );
};

export default PageHeader;
