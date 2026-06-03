import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Mountain, Menu, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";

const NAV_EASE = [0.22, 1, 0.36, 1] as const;
import { BRAND_ASSETS } from "@/config/assets";

const navLinks = [
  { label: "Destinos", href: "#destinos" },
  { label: "Guía de Equipo", href: "/gear" },
  { label: "Blog", href: "/blog" },
  { label: "Servicios", href: "/servicios" },
  { label: "Calculadora", href: "/calculadora" },
  { label: "Sobre Nosotros", href: "/sobre-nosotros" },
];

const Navbar = () => {
  const { pathname } = useLocation();
  const isHomepage = pathname === "/";

  // Ref keeps the closure in useMotionValueEvent always current on route changes
  const isHomepageRef = useRef(isHomepage);
  isHomepageRef.current = isHomepage;

  // Inner pages start solid; homepage starts transparent (over the hero)
  const [scrolled, setScrolled] = useState(!isHomepage);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [open, setOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const threshold = isHomepageRef.current ? window.innerHeight * 0.9 : 40;
    setScrolled(latest > threshold);
    setShowScrollTop(latest > window.innerHeight);
  });

  // Re-evaluate immediately on SPA route navigation
  useEffect(() => {
    const threshold = isHomepage ? window.innerHeight * 0.9 : 40;
    setScrolled(scrollY.get() > threshold);
  }, [pathname, isHomepage, scrollY]);

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
        {/* Warm frosted glass background — fades in past the hero fold */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 bg-sand/85 backdrop-blur-md border-b border-stone/30"
          initial={false}
          animate={{ opacity: scrolled ? 1 : 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />

        <div className="container mx-auto flex items-center justify-between px-5 py-4">
          <Link to="/" className="relative z-10 flex items-center gap-2">
            {BRAND_ASSETS.logo && !logoError ? (
              <img
                src={BRAND_ASSETS.logo}
                alt="Nomaderia"
                loading="lazy"
                className="h-8 w-auto"
                onError={() => setLogoError(true)}
              />
            ) : (
              <>
                <Mountain className={cn(
                  "h-6 w-6 transition-colors duration-300",
                  scrolled ? "text-primary" : "text-white"
                )} />
                <span className={cn(
                  "font-serif text-xl font-bold tracking-wide transition-colors duration-300",
                  scrolled ? "text-foreground" : "text-white"
                )}>
                  NOMADERIA
                </span>
              </>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="relative z-10 hidden md:flex items-center gap-8">
            {navLinks.map((link, i) => {
              const linkClassName = cn(
                "text-sm font-medium transition-colors duration-300",
                scrolled
                  ? "text-foreground/80 hover:text-primary"
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
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-11">
                <a href="#quiz">Descubre Tu Aventura</a>
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + navLinks.length * 0.06, duration: 0.4, ease: NAV_EASE }}
              >
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-11">
                  <a href="#quiz">Descubre Tu Aventura</a>
                </Button>
              </motion.div>
            )}
          </nav>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="relative z-10 md:hidden min-h-[44px] min-w-[44px]"
            aria-label="Abrir menú de navegación"
            title="Abrir menú de navegación"
            onClick={() => setOpen(true)}
          >
            <Menu className={cn(
              "h-6 w-6 transition-colors duration-300",
              scrolled ? "text-foreground" : "text-white"
            )} />
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
                {BRAND_ASSETS.logo && !logoError ? (
                  <img src={BRAND_ASSETS.logo} alt="Nomaderia" loading="lazy" className="h-8 w-auto" onError={() => setLogoError(true)} />
                ) : (
                  <>
                    <Mountain className="h-6 w-6 text-primary" />
                    <span className="font-serif text-xl font-bold tracking-wide text-foreground">
                      NOMADERIA
                    </span>
                  </>
                )}
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
                const className = "text-2xl font-serif font-bold text-foreground hover:text-primary transition-colors min-h-[48px] flex items-center";
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
                  className="bg-primary text-primary-foreground w-full h-14 text-lg shadow-lg shadow-primary/20"
                  onClick={() => setOpen(false)}
                >
                  <a href="#quiz">Descubre Tu Aventura</a>
                </Button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-40 bg-primary hover:bg-primary/80 text-primary-foreground rounded-full p-3.5 shadow-lg shadow-primary/30 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
