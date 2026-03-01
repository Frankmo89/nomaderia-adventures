import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mountain, Menu, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Destinos", href: "#destinos" },
  { label: "Gear Guide", href: "/gear" },
  { label: "Blog", href: "/blog" },
  { label: "Servicios", href: "/servicios" },
  { label: "Calculadora", href: "/calculadora" },
  { label: "Sobre Nosotros", href: "/sobre-nosotros" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > window.innerHeight);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-background/80 backdrop-blur-xl shadow-lg border-b border-border/50"
            : "bg-transparent"
        )}
      >
        <div className="container mx-auto flex items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-primary" />
            <span className={cn(
              "font-serif text-xl font-bold tracking-wide transition-colors duration-500",
              scrolled ? "text-foreground" : "text-white"
            )}>
              NOMADERIA
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    scrolled ? "text-foreground/80 hover:text-primary" : "text-white/80 hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    scrolled ? "text-foreground/80 hover:text-primary" : "text-white/80 hover:text-white"
                  )}
                >
                  {link.label}
                </a>
              )
            )}
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-11">
              <a href="#quiz">Descubre Tu Aventura</a>
            </Button>
          </nav>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden min-h-[44px] min-w-[44px]"
            onClick={() => setOpen(true)}
          >
            <Menu className={cn("h-6 w-6", scrolled ? "text-foreground" : "text-white")} />
          </Button>
        </div>
      </header>

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
                <Mountain className="h-6 w-6 text-primary" />
                <span className="font-serif text-xl font-bold tracking-wide text-foreground">
                  NOMADERIA
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
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
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-40 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-3.5 shadow-lg shadow-primary/30 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
