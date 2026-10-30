import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import Hiker from "@/components/shared/Hiker";
import { groupScale } from "@/lib/calculator-scene";

// «¿Cuántos viajan?» as a row of hikers (ADR-061): one per traveler, grown-ups
// and kids mixed. Adding one, a hiker walks in from the left; removing one, the
// last walks off. The row takes a few steps after each change, then stands.

interface PeopleStepperProps {
  id: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}

/** Leader's height in px; the rest scale from it. */
const HIKER_PX = 38;
/** How long the row walks after a change. */
const WALK_MS = 2400;
/** Hiker color: Ink (design system). */
const INK = "#13211A";

const PeopleStepper = ({ id, value, onChange, min = 1, max = 8 }: PeopleStepperProps) => {
  const reduceMotion = useReducedMotion();
  const count = Math.min(Math.max(Math.round(value) || min, min), max);
  const [walking, setWalking] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const step = (delta: number) => {
    const next = Math.min(Math.max(count + delta, min), max);
    if (next === count) return;
    onChange(next);
    if (reduceMotion) return;
    setWalking(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setWalking(false), WALK_MS);
  };

  const buttonClass =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-background text-ink transition-colors hover:border-green/50 hover:bg-green-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3">
      <button
        type="button"
        className={buttonClass}
        onClick={() => step(-1)}
        disabled={count <= min}
        aria-label="Quitar una persona"
        aria-controls={id}
      >
        <Minus className="h-4 w-4" aria-hidden />
      </button>

      <div className="min-w-0 flex-1">
        <div
          className="calc-walkers flex h-[42px] items-end justify-center gap-1 overflow-hidden"
          data-walking={walking ? "" : undefined}
          aria-hidden="true"
        >
          <AnimatePresence initial={false}>
            {Array.from({ length: count }, (_, i) => {
              const scale = groupScale(i);
              return (
                <motion.span
                  key={i}
                  className="block shrink-0"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 14 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Hiker
                    color={INK}
                    className="calc-walker"
                    style={
                      {
                        height: `${HIKER_PX * scale}px`,
                        width: `${HIKER_PX * 0.6 * scale}px`,
                        "--step": `${(0.8 * scale).toFixed(3)}s`,
                        "--d": `${-((i * 0.29) % 0.8).toFixed(2)}s`,
                      } as CSSProperties
                    }
                  />
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>
        <p id={id} className="mt-1 text-center text-sm font-semibold text-ink" aria-live="polite">
          {count} {count === 1 ? "persona" : "personas"}
        </p>
      </div>

      <button
        type="button"
        className={buttonClass}
        onClick={() => step(1)}
        disabled={count >= max}
        aria-label="Agregar una persona"
        aria-controls={id}
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
};

export default PeopleStepper;
