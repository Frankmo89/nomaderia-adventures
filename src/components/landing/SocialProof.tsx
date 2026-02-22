import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, MapPin, ShieldCheck } from "lucide-react";

const SocialProof = () => {
  const { data: quizCount = 0 } = useQuery({
    queryKey: ["quiz-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("quiz_responses")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: destCount = 0 } = useQuery({
    queryKey: ["destinations-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("destinations")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true);
      return count || 0;
    },
  });

  const stats = [
    {
      icon: Users,
      value: quizCount > 0 ? `${quizCount}+` : "—",
      label: "Aventureros han encontrado su destino ideal",
      sublabel: "con nuestro quiz personalizado",
    },
    {
      icon: MapPin,
      value: destCount > 0 ? `${destCount}` : "—",
      label: "Destinos documentados con guías completas",
      sublabel: "desde fin de semana hasta expediciones",
    },
    {
      icon: ShieldCheck,
      value: "TAP",
      label: "Agente de viajes certificada",
      sublabel: "National TAP Test — The Travel Institute, USA",
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-muted relative overflow-hidden">
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
      }} />

      <div className="container mx-auto px-5 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-3 block">
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
              className="bg-card rounded-2xl p-8 text-center shadow-lg border border-border/50"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-5">
                <stat.icon className="h-7 w-7 text-primary" />
              </div>

              {/* Value */}
              <p className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-2">
                {stat.value}
              </p>

              {/* Label */}
              <p className="text-foreground font-medium text-sm sm:text-base mb-1">
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
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            🧭 Descubre tu destino ideal
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;
