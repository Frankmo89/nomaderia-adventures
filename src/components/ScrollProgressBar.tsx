import { useEffect, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

/**
 * Thin green line at the top: how far down the page you are.
 * Progress comes from scrollY and the page height read on each scroll, not
 * from `scrollYProgress`: Framer measures the page once on mount, when the
 * lazy sections are not there yet, finds nothing to scroll and reports 1, so
 * the line started full on the home until the first scroll.
 */
export const ScrollProgressBar = () => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, (y) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
  });
  const scaleX = useSpring(progress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (reducedMotion) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[100] h-[3px] origin-left bg-green"
      style={{ scaleX }}
    />
  );
};
