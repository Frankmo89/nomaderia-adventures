import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import Logo from "@/components/brand/Logo";
import { hasHeroForPath } from "@/lib/hero-routes";

const NAV_EASE = [0.22, 1, 0.36, 1] as const;

// Scroll thresholds: homepage goes solid early (before hero CTAs enter the navbar zone);
// other hero routes go solid sooner since their hero sections are shorter.
const HOMEPAGE_SCROLL_THRESHOLD_PX = 100;
const INNER_PAGE_SCROLL_THRESHOLD_PX = 40;

// Which routes start with a transparent navbar: see src/lib/hero-routes.ts.

/**
 * "Back to top" shows only when it helps and never on top of a form:
 *  - past the first screen, and only after scrolling UP (going back is the
 *    intent; while reading down it would just cover the page);
 *  - never while an element marked `data-hide-scroll-top` (the quiz) sits in
 *    the bottom band where the button lives, so it can't cover "Continuar";
 *  - it leaves again after a few idle seconds (not while hovered or focused),
 *    so it doesn't sit on the text being read.
 */
const SCROLL_DIRECTION_SLOP_PX = 6;
const SCROLL_TOP_BAND_PX = 160;
const SCROLL_TOP_IDLE_MS = 3000;

/** True from Tailwind's lg breakpoint (1024px) up; follows window resizes. */
function useIsDesktop(): boolean {
  const query = "(min-width: 1024px)";
  const [desktop, setDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.(query).matches === true,
  );
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setDesktop(e.matches);
    setDesktop(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return desktop;
}

/** Hamburger glyph, 18 × 12 with 2 px strokes: bolder than lucide's so it reads over photos. */
function MenuGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 12" fill="none" aria-hidden="true" className={className}>
      <path d="M1 1h16M1 6h16M1 11h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function hiddenZoneUnderButton(): boolean {
  const vh = window.innerHeight;
  return Array.from(document.querySelectorAll<HTMLElement>("[data-hide-scroll-top]")).some((el) => {
    const r = el.getBoundingClientRect();
    return r.top < vh && r.bottom > vh - SCROLL_TOP_BAND_PX;
  });
}

const navLinks = [
  { label: "Destinos", href: "/destinos" },
  { label: "Guía de Equipo", href: "/gear" },
  { label: "Blog", href: "/blog" },
  { label: "Servicios", href: "/servicios" },
  { label: "Calculadora", href: "/calculadora" },
  { label: "Sobre Nosotros", href: "/sobre-nosotros" },
];

const Navbar = () => {
  const { pathname } = useLocation();
  const isHomepage = pathname === "/";
  const isDesktop = useIsDesktop();
  const hasHero = hasHeroForPath(pathname, { desktop: isDesktop });

  // Refs keep the closures in useMotionValueEvent always current on route changes
  const isHomepageRef = useRef(isHomepage);
  isHomepageRef.current = isHomepage;
  const hasHeroRef = useRef(hasHero);
  hasHeroRef.current = hasHero;

  // Hero-less pages always render solid; hero pages start transparent (over the hero)
  const [scrolled, setScrolled] = useState(!hasHero);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTopButton = useRef<HTMLButtonElement>(null);
  const scrollTopTimer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!hasHeroRef.current) {
      setScrolled(true);
    } else {
      const threshold = isHomepageRef.current ? HOMEPAGE_SCROLL_THRESHOLD_PX : INNER_PAGE_SCROLL_THRESHOLD_PX;
      setScrolled(latest > threshold);
    }
    const delta = latest - lastScrollY.current;
    if (Math.abs(delta) >= SCROLL_DIRECTION_SLOP_PX) {
      lastScrollY.current = latest;
      window.clearTimeout(scrollTopTimer.current);
      if (delta < 0 && latest > window.innerHeight && !hiddenZoneUnderButton()) {
        setShowScrollTop(true);
        const hideWhenIdle = () => {
          if (scrollTopButton.current?.matches(":hover, :focus-visible")) {
            scrollTopTimer.current = window.setTimeout(hideWhenIdle, SCROLL_TOP_IDLE_MS);
          } else {
            setShowScrollTop(false);
          }
        };
        scrollTopTimer.current = window.setTimeout(hideWhenIdle, SCROLL_TOP_IDLE_MS);
      } else {
        setShowScrollTop(false);
      }
    }
  });

  useEffect(() => () => window.clearTimeout(scrollTopTimer.current), []);

  // Re-evaluate immediately on SPA route navigation
  useEffect(() => {
    if (!hasHero) {
      setScrolled(true);
      return;
    }
    const threshold = isHomepage ? HOMEPAGE_SCROLL_THRESHOLD_PX : INNER_PAGE_SCROLL_THRESHOLD_PX;
    setScrolled(scrollY.get() > threshold);
  }, [pathname, hasHero, isHomepage, scrollY]);

  // A new page starts without the "back to top" button.
  useEffect(() => {
    window.clearTimeout(scrollTopTimer.current);
    setShowScrollTop(false);
    lastScrollY.current = scrollY.get();
  }, [pathname, scrollY]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50"
        initial={false}
      >
        {/* Warm frosted glass background — fades in at 100px scroll on homepage, 40px on inner pages */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 bg-sand/85 backdrop-blur-md border-b border-stone/30"
          initial={false}
          animate={{ opacity: scrolled ? 1 : 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />

        {/* Over the home hero (phones and tablets) the row sits 14 px under
            the story bars (8 px + 3 px), so the logo doesn't touch them. */}
        <div
          className={cn(
            "container mx-auto flex items-center justify-between px-5 py-4 transition-[padding] duration-300",
            isHomepage && !scrolled && "max-lg:pt-[25px]",
          )}
        >
          <Link to="/" className="relative z-10 flex items-center gap-2">
            <Logo
              variant={scrolled ? "default" : "onDark"}
              className="h-[30px] w-auto md:h-9"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="relative z-10 hidden md:flex items-center gap-8">
            {navLinks.map((link, i) => {
              const linkClassName = cn(
                "text-sm font-medium transition-colors duration-300",
                scrolled
                  ? "text-foreground/80 hover:text-green"
                  : "text-white/90 hover:text-white text-shadow-hero"
              );
              const linkEl = link.href.startsWith("/") ? (
                <Link to={link.href} className={linkClassName}>
                  {link.label}
                </Link>
              ) : (
                <a href={link.href} className={linkClassName}>
                  {link.label}
                </a>
              );

              if (prefersReducedMotion) return <div key={link.label}>{linkEl}</div>;

              return (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: NAV_EASE }}
                >
                  {linkEl}
                </motion.div>
              );
            })}

            {prefersReducedMotion ? (
              <Button asChild className="bg-green hover:bg-green-dark text-white shadow-lg shadow-green/20 h-11">
                <Link to="/#quiz">Descubre Tu Aventura</Link>
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + navLinks.length * 0.06, duration: 0.4, ease: NAV_EASE }}
              >
                <Button asChild className="bg-green hover:bg-green-dark text-white shadow-lg shadow-green/20 h-11">
                  <Link to="/#quiz">Descubre Tu Aventura</Link>
                </Button>
              </motion.div>
            )}
          </nav>

          {/* Mobile menu: a round glass button over photos (same glass as the
              hero's place pill), a quiet ring on the cream bar. It dips a
              little when pressed. */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative z-10 h-11 w-11 rounded-full border md:hidden",
              "transition-colors duration-300 motion-safe:transition-[transform,background-color,border-color] motion-safe:active:scale-[0.93]",
              scrolled
                ? "border-forest-dark/10 bg-forest-dark/[0.04] text-foreground hover:bg-forest-dark/[0.08] hover:text-foreground"
                : "border-white/[0.16] bg-forest-dark/45 text-white backdrop-blur-[8px] hover:bg-forest-dark/55 hover:text-white",
            )}
            aria-label="Abrir menú de navegación"
            title="Abrir menú de navegación"
            onClick={() => setOpen(true)}
          >
            <MenuGlyph className="h-3 w-[18px]" />
          </Button>
        </div>
      </motion.header>

      {/* Full-screen mobile menu overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-background flex flex-col"
          >
            {/* Close bar */}
            <div className="flex items-center justify-between px-5 py-4">
              <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <Logo variant="default" className="h-8 w-auto md:h-9" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                aria-label="Cerrar menú de navegación"
                title="Cerrar menú de navegación"
                onClick={() => setOpen(false)}
              >
                <X className="h-6 w-6 text-foreground" />
              </Button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 flex flex-col justify-center items-center gap-6 px-8">
              {navLinks.map((link, i) => {
                const className = "text-2xl font-serif font-bold text-foreground hover:text-green transition-colors min-h-[48px] flex items-center";
                return (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    {link.href.startsWith("/") ? (
                      <Link to={link.href} onClick={() => setOpen(false)} className={className}>
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} onClick={() => setOpen(false)} className={className}>
                        {link.label}
                      </a>
                    )}
                  </motion.div>
                );
              })}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="w-full max-w-xs mt-4"
              >
                <Button
                  asChild
                  className="bg-green text-white w-full h-14 text-lg shadow-lg shadow-green/20"
                  onClick={() => setOpen(false)}
                >
                  <Link to="/#quiz">Descubre Tu Aventura</Link>
                </Button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to top button — esquina inferior IZQUIERDA a propósito: el
          ConciergeLauncher global vive en bottom-right (ConciergeLauncher.tsx),
          y en mobile la StickyMobileCTA cubre toda la franja inferior, así que
          reclama la esquina vacía en vez de competir por la misma (hallazgo
          Mobbin: Navan/Pipedrive). Mismo offset elevado en mobile que el
          launcher para no quedar tapado por StickyMobileCTA. z-[1200]: el mapa
          de senderos (TrailsSection) usa Leaflet, cuyo control de zoom pinta a
          z-index 1000 fuera de su propio stacking context — verificado con
          elementFromPoint, no alcanza con z-50 para quedar siempre encima. */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            ref={scrollTopButton}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })}
            aria-label="Volver arriba"
            className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-6 z-[1200] bg-green hover:bg-green-dark text-white rounded-full p-3.5 shadow-lg shadow-green/30 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <ArrowUp className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
