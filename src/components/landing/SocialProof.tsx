import { useEffect, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { Users, MapPin, ShieldCheck, BookOpen } from "lucide-react";
import Reveal, { RevealGroup } from "@/components/editorial/Reveal";
import { usePublicStats } from "@/hooks/use-public-stats";

/** Animated counter that counts from 0 to `target` when visible */
const AnimatedCounter = ({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) => {
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (v) => `${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (!hasEnteredViewport) return;

    if (prefersReducedMotion) {
      motionVal.set(target);
      return;
    }

    const controls = animate(motionVal, target, {
      duration: 1.1,
      ease: "easeOut",
    });

    return () => controls.stop();
  }, [hasEnteredViewport, motionVal, prefersReducedMotion, target]);

  return (
    <motion.span
      aria-live="polite"
      aria-atomic="true"
      role="status"
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      onViewportEnter={() => setHasEnteredViewport(true)}
    >
      {display}
    </motion.span>
  );
};

const SocialProof = () => {
  const { data: stats, isLoading } = usePublicStats();

  // Keep quiz social proof hidden until the signal is strong enough.
  const dataStats = [
    stats?.quizResponses && stats.quizResponses >= 50
      ? {
          icon: Users,
          value: stats.quizResponses,
          suffix: "",
          label: "Aventureros han hecho el quiz",
          sublabel: "y encontraron su destino ideal",
          isTap: false,
        }
      : null,
    stats?.destinations && stats.destinations > 0
      ? {
          icon: MapPin,
          value: stats.destinations,
          suffix: "",
          label: "Destinos guiados",
          sublabel: "con guías completas para principiantes",
          isTap: false,
        }
      : null,
    stats?.blogPosts && stats.blogPosts > 0
      ? {
          icon: BookOpen,
          value: stats.blogPosts,
          suffix: "",
          label: "Guías publicadas",
          sublabel: "aventura outdoor en español",
          isTap: false,
        }
      : null,
  ].filter(Boolean) as Array<{
    icon: typeof Users;
    value: number;
    suffix: string;
    label: string;
    sublabel: string;
    isTap: boolean;
  }>;

  // TAP credential is always shown — it is a real certification, not a number
  const tapCard = {
    icon: ShieldCheck,
    value: 0,
    suffix: "",
    label: "Agente de viajes certificada",
    sublabel: "National TAP Test — The Travel Institute, USA",
    isTap: true,
  };

  const visibleStats = [...dataStats, tapCard];

  // Show nothing while loading to avoid a flash of stale/zero numbers
  if (isLoading) return null;

  return (
    <section className="py-16 sm:py-24 bg-wash-sand relative overflow-hidden">
      <div className="container mx-auto px-5 relative z-10">
        {/* Header */}
        <Reveal className="text-center mb-12 sm:mb-16">
          <span className="text-[#D97706] text-sm font-semibold tracking-wider uppercase mb-3 block">
            Respaldado por datos reales
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            ¿Por Qué Confiar en Nomaderia?
          </h2>
        </Reveal>

        {/* Stats grid */}
        <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto" stagger>
          {visibleStats.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -4 }}
              className="bg-card rounded-2xl p-8 text-center border border-stone/70 shadow-editorial transition-all duration-200 hover:shadow-editorial-hover"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sand mb-5 border border-stone/70">
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
        </RevealGroup>

        {/* CTA */}
        <Reveal className="text-center mt-10 sm:mt-14">
          <a
            href="#quiz"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-editorial transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-editorial-hover active:translate-y-0 active:scale-[0.98]"
          >
            🧭 Descubre tu destino ideal
          </a>
        </Reveal>
      </div>
    </section>
  );
};

export default SocialProof;
