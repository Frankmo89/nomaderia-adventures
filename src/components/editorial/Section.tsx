import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionVariant = "default" | "sand" | "walnut";

interface SectionProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  variant?: SectionVariant;
}

const variantClasses: Record<SectionVariant, string> = {
  default: "bg-background text-foreground",
  sand: "bg-sand text-foreground",
  walnut: "bg-walnut text-[#FAFAFA]",
};

const Section = ({ children, className, innerClassName, variant = "default" }: SectionProps) => {
  return (
    <section className={cn("section-editorial", variantClasses[variant], className)}>
      <div className={cn("container mx-auto px-5", innerClassName)}>{children}</div>
    </section>
  );
};

export default Section;