import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Footprints, Map, Mountain, Shield, TreePine, Sun, Compass, User, Users, Heart, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuizOption {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const steps: { question: string; key: string; options: QuizOption[] }[] = [
  {
    question: "¿Cuál es tu nivel de actividad física?",
    key: "fitness_level",
    options: [
      { label: "Camino poco", value: "sedentary", icon: <Footprints className="h-8 w-8" /> },
      { label: "Camino seguido", value: "light_activity", icon: <Map className="h-8 w-8" /> },
      { label: "Hago ejercicio regular", value: "moderate", icon: <Mountain className="h-8 w-8" /> },
      { label: "Soy bastante activo", value: "active", icon: <Shield className="h-8 w-8" /> },
    ],
  },
  {
    question: "¿Qué paisaje te emociona más?",
    key: "interest",
    options: [
      { label: "Montañas", value: "mountains", icon: <Mountain className="h-8 w-8" /> },
      { label: "Bosques", value: "forests", icon: <TreePine className="h-8 w-8" /> },
      { label: "Desiertos", value: "deserts", icon: <Sun className="h-8 w-8" /> },
      { label: "Caminos Culturales", value: "cultural", icon: <Compass className="h-8 w-8" /> },
    ],
  },
  {
    question: "¿Cuántos días tienes?",
    key: "trip_duration",
    options: [
      { label: "Un fin de semana", value: "weekend", icon: <Sun className="h-8 w-8" /> },
      { label: "Una semana", value: "one_week", icon: <Compass className="h-8 w-8" /> },
      { label: "Dos semanas o más", value: "two_weeks", icon: <Map className="h-8 w-8" /> },
    ],
  },
  {
    question: "¿Con quién irías?",
    key: "travel_style",
    options: [
      { label: "Solo/a", value: "solo", icon: <User className="h-8 w-8" /> },
      { label: "En pareja", value: "couple", icon: <Heart className="h-8 w-8" /> },
      { label: "Con amigos", value: "friends", icon: <Users className="h-8 w-8" /> },
      { label: "En familia", value: "family", icon: <Users className="h-8 w-8" /> },
    ],
  },
];

const QuizSection = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const totalSteps = steps.length;
  const isQuizDone = step >= totalSteps;

  const handleSelect = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (step < totalSteps - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      setStep(totalSteps); // move to email step
    }
  };

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    try {
      // Fetch matching destinations
      const { data: destinations } = await supabase
        .from("destinations")
        .select("id, title, slug, short_description, difficulty_level, country, estimated_budget_usd, days_needed")
        .eq("is_published", true);

      // Simple matching logic
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

      // Save to DB
      await supabase.from("quiz_responses").insert({
        email,
        fitness_level: answers.fitness_level,
        interest: answers.interest,
        trip_duration: answers.trip_duration,
        travel_style: answers.travel_style,
        recommended_destinations: top.map((d) => d.id),
      });

      // Also save as newsletter subscriber
      await supabase.from("newsletter_subscribers").insert({ email, source: "quiz" }).select();

      setShowResults(true);
    } catch (err) {
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

  if (showResults) {
    return (
      <section id="quiz" className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            🎉 Tu Aventura Ideal
          </h2>
          <p className="text-muted-foreground mb-10">Basado en tus respuestas, estos destinos son perfectos para ti:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {results.map((d) => (
              <a key={d.id} href={`/destinos/${d.slug}`} className="block bg-card rounded-xl p-6 text-card-foreground hover:scale-105 transition-transform">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-3 ${difficultyColor[d.difficulty_level]}`}>
                  {difficultyLabel[d.difficulty_level]}
                </span>
                <h3 className="font-serif text-lg font-bold mb-2">{d.title}</h3>
                <p className="text-sm opacity-80 mb-2">{d.country} · {d.days_needed} · ~${d.estimated_budget_usd} USD</p>
                <p className="text-sm">{d.short_description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="quiz" className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2"
        >
          No Sabes A Dónde Ir?
        </motion.h2>
        <p className="text-muted-foreground mb-8">Responde {totalSteps} preguntas y te recomendamos tu aventura ideal</p>

        {/* Progress bar */}
        <div className="w-full bg-border rounded-full h-2 mb-10">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${((isQuizDone ? totalSteps : step) / totalSteps) * 100}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          {!isQuizDone ? (
            <motion.div key={step} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
              <h3 className="font-serif text-xl md:text-2xl font-semibold text-foreground mb-8">
                {steps[step].question}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {steps[step].options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(steps[step].key, opt.value)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 hover:border-primary hover:bg-primary/10 ${
                      answers[steps[step].key] === opt.value ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    <span className="text-primary">{opt.icon}</span>
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="email" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <h3 className="font-serif text-xl md:text-2xl font-semibold text-foreground mb-4">
                ¡Casi listo! 🎉
              </h3>
              <p className="text-muted-foreground mb-6">Ingresa tu email para ver tu aventura ideal</p>
              <div className="flex gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted text-foreground"
                />
                <Button onClick={handleSubmit} disabled={loading} className="bg-primary text-primary-foreground whitespace-nowrap">
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
