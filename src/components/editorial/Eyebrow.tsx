import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface EyebrowProps extends HTMLAttributes<HTMLSpanElement> {
  as?: "span" | "p";
}

const Eyebrow = ({ as: Component = "span", className, children, ...props }: EyebrowProps) => {
  return (
    <Component
      className={cn(
        "text-eyebrow font-medium uppercase tracking-[0.18em] text-primary",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Eyebrow;