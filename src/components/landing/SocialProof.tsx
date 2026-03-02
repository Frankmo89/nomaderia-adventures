import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring, useInView } from "framer-motion";
import { Users, MapPin, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuizCount, useDestinationsCount } from "@/hooks/use-stats";

/** Animated counter that counts from 0 to `target` when visible and loaded */
const AnimatedCounter = ({
  target,
  suffix = "",
  isLoading = false,
}: {
  target: number;
  suffix?: string;
  isLoading?: boolean;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, { stiffness: 60, damping: 20 });
  const display = useTransform(springVal, (v) => `${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (isInView && !isLoading && target > 0) {
      motionVal.set(target);
    }
  }, [isInView, isLoading, target, motionVal]);

  if (isLoading) {
    return (
      <span ref={ref} aria-label="Cargando" role="status">
        <Skeleton className="inline-block h-10 w-16 rounded-md" />
      </span>
    );
  }
  if (target <= 0) {
    return (
      <span ref={ref} aria-live="polite" aria-atomic="true" role="status">
        —
      </span>
    );
  }

  return (
    <motion.span ref={ref} aria-live="polite" aria-atomic="true" role="status">
      {display}
    </motion.span>
  );
};

const SocialProof = () => {
  const { data: quizCount = 0, isLoading: quizLoading } = useQuizCount();
  const { data: destCount = 0, isLoading: destLoading } = useDestinationsCount();

  const stats = [
    {
      icon: Users,
      value: quizCount,
      suffix: "+",
      label: "Aventureros han encontrado su destino ideal",
      sublabel: "con nuestro quiz personalizado",
      isTap: false,
      isLoading: quizLoading,
    },
    {
      icon: MapPin,
      value: destCount,
      suffix: "",
      label: "Destinos documentados con guías completas",
      sublabel: "desde fin de semana hasta expediciones",
      isTap: false,
      isLoading: destLoading,
    },
    {
      icon: ShieldCheck,
      value: 0,
      suffix: "",
      label: "Agente de viajes certificada",
      sublabel: "National TAP Test — The Travel Institute, USA",
      isTap: true,
      isLoading: false,
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-5 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-[#D97706] text-sm font-semibold tracking-wider uppercase mb-3 block">
            Respaldado por datos reales
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            ¿Por Qué Confiar en Nomaderia?
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              whileHover={{ y: -4, borderColor: "#D97706" }}
              className="bg-white rounded-2xl p-8 text-center border border-amber-100 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 mb-5">
                {stat.isTap ? (
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ShieldCheck className="h-7 w-7 text-[#D97706]" />
                  </motion.div>
                ) : (
                  <stat.icon className="h-7 w-7 text-[#D97706]" />
                )}
              </div>

              {/* Value */}
              <p className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-2">
                {stat.isTap ? (
                  "TAP"
                ) : (
                  <AnimatedCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    isLoading={stat.isLoading}
                  />
                )}
              </p>

              {/* Label */}
              <p className="text-foreground/80 font-medium text-sm sm:text-base mb-1">
                {stat.label}
              </p>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {stat.sublabel}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10 sm:mt-14"
        >
          <a
            href="#quiz"
            className="inline-flex items-center gap-2 bg-[#D97706] hover:bg-[#D97706]/90 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            🧭 Descubre tu destino ideal
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;
