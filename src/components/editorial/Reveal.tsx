import { Children } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export const EXPO_OUT = [0.22, 1, 0.36, 1] as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const Reveal = ({ children, className, delay = 0 }: RevealProps) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EXPO_OUT, delay }}
    >
      {children}
    </motion.div>
  );
};

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
}

export const RevealGroup = ({ children, className, stagger = false }: RevealGroupProps) => {
  const prefersReducedMotion = useReducedMotion();
  const kids = Children.toArray(children);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {kids.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.6,
            ease: EXPO_OUT,
            delay: stagger ? i * 0.08 : 0,
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

export default Reveal;
