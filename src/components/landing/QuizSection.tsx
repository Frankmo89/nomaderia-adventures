import { useState, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Footprints, Map, Mountain, Shield, TreePine, Sun, Compass, User, Users, Heart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface QuizOption {
  label: string;
  value: string;
  icon: React.ReactNode;
  emoji: string;
}

const steps: { question: string; key: string; options: QuizOption[] }[] = [
  {
    question: "¿Cuál es tu nivel de actividad física?",
    key: "fitness_level",
    options: [
      { label: "Camino poco", value: "sedentary", icon: <Footprints className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🚶" },
      { label: "Camino seguido", value: "light_activity", icon: <Map className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🏃" },
      { label: "Hago ejercicio regular", value: "moderate", icon: <Mountain className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "💪" },
      { label: "Soy bastante activo", value: "active", icon: <Shield className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🔥" },
    ],
  },
  {
    question: "¿Qué paisaje te emociona más?",
    key: "interest",
    options: [
      { label: "Montañas", value: "mountains", icon: <Mountain className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🏔️" },
      { label: "Bosques", value: "forests", icon: <TreePine className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🌲" },
      { label: "Desiertos", value: "deserts", icon: <Sun className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🏜️" },
      { label: "Caminos Culturales", value: "cultural", icon: <Compass className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🏛️" },
    ],
  },
  {
    question: "¿Cuántos días tienes?",
    key: "trip_duration",
    options: [
      { label: "Un fin de semana", value: "weekend", icon: <Sun className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "📅" },
      { label: "Una semana", value: "one_week", icon: <Compass className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🗓️" },
      { label: "Dos semanas o más", value: "two_weeks", icon: <Map className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🌍" },
    ],
  },
  {
    question: "¿Con quién irías?",
    key: "travel_style",
    options: [
      { label: "Solo/a", value: "solo", icon: <User className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🧭" },
      { label: "En pareja", value: "couple", icon: <Heart className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "❤️" },
      { label: "Con amigos", value: "friends", icon: <Users className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "👯" },
      { label: "En familia", value: "family", icon: <Users className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "👨‍👩‍👧‍👦" },
    ],
  },
];

const swipeThreshold = 50;

const QuizSection = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [direction, setDirection] = useState(1);
  const { toast } = useToast();

  const totalSteps = steps.length;
  const isQuizDone = step >= totalSteps;

  const handleSelect = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (step < totalSteps - 1) {
      setDirection(1);
      setTimeout(() => setStep(step + 1), 400);
    } else {
      setDirection(1);
      setStep(totalSteps);
    }
  };

  const handleSwipe = (_: any, info: PanInfo) => {
    if (isQuizDone) return;
    if (info.offset.x < -swipeThreshold && step < totalSteps - 1 && answers[steps[step].key]) {
      setDirection(1);
      setStep(step + 1);
    } else if (info.offset.x > swipeThreshold && step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const { data: destinations } = await supabase
        .from("destinations")
        .select("id, title, slug, short_description, difficulty_level, country, estimated_budget_usd, days_needed, hero_image_url")
        .eq("is_published", true);

      const scored = (destinations || []).map((d) => {
        let score = 0;
        if (answers.interest === "mountains" && d.difficulty_level !== "challenging") score += 2;
        if (answers.interest === "cultural" && d.slug === "camino-de-santiago") score += 3;
        if (answers.interest === "deserts" && d.slug === "gran-canon") score += 3;
        if (answers.fitness_level === "sedentary" && d.difficulty_level === "easy") score += 3;
        if (answers.fitness_level === "active" && d.difficulty_level === "challenging") score += 2;
        if (answers.trip_duration === "weekend" && d.days_needed?.includes("1")) score += 2;
        if (answers.trip_duration === "two_weeks" && d.difficulty_level === "challenging") score += 2;
        return { ...d, score };
      });
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, 3);
      setResults(top);

      await supabase.from("quiz_responses").insert({
        email, fitness_level: answers.fitness_level, interest: answers.interest,
        trip_duration: answers.trip_duration, travel_style: answers.travel_style,
        recommended_destinations: top.map((d) => d.id),
      });
      await supabase.from("newsletter_subscribers").insert({ email, source: "quiz" }).select();
      setShowResults(true);
    } catch {
      toast({ title: "Error", description: "Algo salió mal. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const difficultyColor: Record<string, string> = {
    easy: "bg-secondary text-secondary-foreground",
    moderate: "bg-primary/80 text-primary-foreground",
    challenging: "bg-destructive text-destructive-foreground",
  };
  const difficultyLabel: Record<string, string> = { easy: "Fácil", moderate: "Moderado", challenging: "Desafiante" };
  const countryFlag: Record<string, string> = {
    México: "🇲🇽", "Estados Unidos": "🇺🇸", España: "🇪🇸", Argentina: "🇦🇷", Nepal: "🇳🇵",
  };
  const matchLabels = ["🎯 Mejor Match", "⭐ También Recomendado", "✨ Opción Aventurera"];

  if (showResults) {
    return (
      <section id="quiz" className="py-16 sm:py-24 bg-background relative overflow-hidden">
        {/* Subtle celebration background */}
        <div className="absolute inset-0 opacity-[0.04] bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=60)` }} />

        <div className="container mx-auto px-5 max-w-5xl relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-10 sm:mb-14"
          >
            <span className="text-5xl sm:text-6xl mb-4 block">🏔️</span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3">
              🎉 ¡Tu Aventura Ideal!
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              Basado en tus respuestas, estos destinos son perfectos para ti
            </p>
          </motion.div>

          {/* Result Cards */}
          <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6">
            {results.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.2, duration: 0.6, ease: "easeOut" }}
                className={i === 0 ? "sm:col-span-3 sm:max-w-2xl sm:mx-auto" : ""}
              >
                <Link
                  to={`/destinos/${d.slug}`}
                  className="block rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 active:scale-[0.98] sm:hover:scale-[1.02] group relative"
                >
                  {/* Image */}
                  <div className={`relative overflow-hidden ${i === 0 ? "h-64 sm:h-80" : "h-52 sm:h-56"}`}>
                    {d.hero_image_url ? (
                      <img
                        src={d.hero_image_url}
                        alt={`Vista de ${d.title}`}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-primary/20" />
                    )}
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

                    {/* Match label */}
                    <div className="absolute top-4 left-4">
                      <span className="inline-block px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-background/90 backdrop-blur-sm text-foreground shadow-md">
                        {matchLabels[i] || matchLabels[2]}
                      </span>
                    </div>

                    {/* Difficulty badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${difficultyColor[d.difficulty_level]}`}>
                        {difficultyLabel[d.difficulty_level]}
                      </span>
                    </div>

                    {/* Content overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                      <h3 className={`font-serif font-bold text-foreground mb-1 ${i === 0 ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}
                        style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
                        {d.title}
                      </h3>
                      <p className="text-sm text-foreground/80 mb-2" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>
                        {countryFlag[d.country] || ""} {d.country} · {d.days_needed} · ~${d.estimated_budget_usd} USD
                      </p>
                      <p className="text-sm text-foreground/70 line-clamp-2 mb-4" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
                        {d.short_description}
                      </p>
                      <span className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-primary/30 transition-colors">
                        Ver Guía Completa →
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Below results */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-10 sm:mt-14 text-center space-y-3"
          >
            <a href="#destinos" className="text-primary hover:underline font-medium text-sm sm:text-base block">
              ¿Ninguno te convence? Explora todos los destinos →
            </a>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Te enviaremos más aventuras personalizadas a tu inbox 📧
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="quiz" className="py-16 sm:py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06] bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=60)` }} />

      <div className="container mx-auto px-5 max-w-2xl text-center relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2"
        >
          ¿No Sabes A Dónde Ir?
        </motion.h2>
        <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">Responde {totalSteps} preguntas y te recomendamos tu aventura ideal</p>

        {/* Progress bar — thicker on mobile */}
        <div className="w-full bg-border rounded-full h-3 sm:h-2 mb-8 sm:mb-10">
          <motion.div
            className="bg-primary h-3 sm:h-2 rounded-full"
            animate={{ width: `${((isQuizDone ? totalSteps : step) / totalSteps) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-6 sm:hidden">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-primary" : i < step ? "w-2 bg-primary/50" : "w-2 bg-foreground/20"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {!isQuizDone ? (
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -80 }}
              transition={{ duration: 0.35 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleSwipe}
            >
              <h3 className="font-serif text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-6 sm:mb-8">
                {steps[step].question}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {steps[step].options.map((opt) => {
                  const isSelected = answers[steps[step].key] === opt.value;
                  return (
                    <motion.button
                      key={opt.value}
                      onClick={() => handleSelect(steps[step].key, opt.value)}
                      whileTap={{ scale: 0.95 }}
                      animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
                      className={`relative flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-8 rounded-xl border-2 transition-all duration-200 min-h-[100px] sm:min-h-0 active:bg-primary/10 hover:border-primary hover:bg-primary/10 ${
                        isSelected ? "border-primary bg-primary/10" : "border-border"
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute top-2 right-2 bg-primary rounded-full p-0.5"
                        >
                          <Check className="h-3.5 w-3.5 text-primary-foreground" />
                        </motion.div>
                      )}
                      <span className="text-xl sm:text-2xl">{opt.emoji}</span>
                      <span className="text-primary">{opt.icon}</span>
                      <span className="text-xs sm:text-sm font-medium text-foreground leading-tight">{opt.label}</span>
                    </motion.button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4 sm:hidden">← Desliza para navegar →</p>
            </motion.div>
          ) : (
            <motion.div key="email" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}>
              <h3 className="font-serif text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-4">
                ¡Casi listo! 🎉
              </h3>
              <p className="text-muted-foreground mb-6 text-sm sm:text-base">Ingresa tu email para ver tu aventura ideal</p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted text-foreground h-12 text-base" />
                <Button onClick={handleSubmit} disabled={loading} className="bg-primary text-primary-foreground whitespace-nowrap shadow-lg shadow-primary/20 h-12 text-base">
                  {loading ? "..." : "Ver Resultados"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default QuizSection;
