import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface QuizOption {
  label: string;
  value: string;
  icon: React.ReactNode;
  emoji: string;
  description?: string;
}

export interface QuizStep {
  question: string;
  subtitle?: string;
  key: string;
  options: QuizOption[];
}

export interface QuizDestination {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  difficulty_level: string;
  country: string;
  estimated_budget_usd: number | null;
  days_needed: string | null;
  hero_image_url: string | null;
  experience_type: string | null;
  region: string | null;
  score: number;
  matchPercent: number;
  matchReasons: string[];
}

type DestinationFields = {
  experience_type: string | null;
  difficulty_level: string;
  short_description: string | null;
  estimated_budget_usd: number | null;
};

type ScoringRule = {
  key: string;
  value: string;
  match: (d: DestinationFields) => boolean;
  weight: number;
  reason: string;
};

function matchesKeywords(d: DestinationFields, keywords: string[]): boolean {
  const exp = d.experience_type?.toLowerCase() ?? "";
  const desc = d.short_description?.toLowerCase() ?? "";
  return keywords.some((kw) => exp.includes(kw) || desc.includes(kw));
}

const SCORING_RULES: ScoringRule[] = [
  // Fitness → difficulty
  { key: "fitness_level", value: "sedentary", match: (d) => d.difficulty_level === "easy", weight: 3, reason: "Nivel de dificultad ideal para tu fitness" },
  { key: "fitness_level", value: "light_activity", match: (d) => d.difficulty_level === "easy" || d.difficulty_level === "moderate", weight: 2, reason: "Dificultad moderada, perfecta para ti" },
  { key: "fitness_level", value: "moderate", match: (d) => d.difficulty_level === "moderate" || d.difficulty_level === "challenging", weight: 2, reason: "Buen reto para tu nivel de actividad" },
  { key: "fitness_level", value: "active", match: (d) => d.difficulty_level === "challenging", weight: 3, reason: "Aventura desafiante para tu nivel activo" },

  // Landscape → experience_type + short_description
  { key: "interest", value: "mountains", match: (d) => matchesKeywords(d, ["mountain", "trek", "montaña"]), weight: 3, reason: "Destino de montaña" },
  { key: "interest", value: "forests", match: (d) => matchesKeywords(d, ["forest", "jungle", "bosque", "selva"]), weight: 3, reason: "Experiencia en naturaleza verde" },
  { key: "interest", value: "deserts", match: (d) => matchesKeywords(d, ["desert", "canyon", "desierto", "cañón"]), weight: 3, reason: "Paisaje desértico impresionante" },
  { key: "interest", value: "cultural", match: (d) => matchesKeywords(d, ["cultural", "pilgrim", "históric"]), weight: 3, reason: "Rica experiencia cultural" },

  // Duration → days_needed
  { key: "trip_duration", value: "weekend", match: (d) => { const desc = d.short_description?.toLowerCase() ?? ""; return desc.includes("1 día") || desc.includes("2 día") || desc.includes("fin de semana"); }, weight: 2, reason: "Perfecto para escapada corta" },
  { key: "trip_duration", value: "one_week", match: (d) => d.difficulty_level === "easy" || d.difficulty_level === "moderate", weight: 2, reason: "Ideal para una semana" },
  { key: "trip_duration", value: "two_weeks", match: (d) => d.difficulty_level === "moderate" || d.difficulty_level === "challenging", weight: 2, reason: "Aventura extendida perfecta" },

  // Budget → estimated_budget_usd
  { key: "budget_range", value: "low", match: (d) => d.estimated_budget_usd != null && d.estimated_budget_usd <= 500, weight: 2, reason: "Dentro de tu presupuesto" },
  { key: "budget_range", value: "medium", match: (d) => d.estimated_budget_usd != null && d.estimated_budget_usd > 500 && d.estimated_budget_usd <= 1500, weight: 2, reason: "Presupuesto moderado ideal" },
  { key: "budget_range", value: "high", match: (d) => d.estimated_budget_usd != null && d.estimated_budget_usd > 1500 && d.estimated_budget_usd <= 3000, weight: 2, reason: "Gran aventura, buena inversión" },
  { key: "budget_range", value: "unlimited", match: (d) => true, weight: 1, reason: "Sin límite de presupuesto" },
];

function scoreDestination(
  answers: Record<string, string>,
  d: DestinationFields
): { score: number; matchReasons: string[] } {
  let score = 0;
  const matchReasons: string[] = [];

  for (const rule of SCORING_RULES) {
    if (answers[rule.key] === rule.value && rule.match(d)) {
      score += rule.weight;
      if (!matchReasons.includes(rule.reason)) {
        matchReasons.push(rule.reason);
      }
    }
  }

  return { score, matchReasons };
}

function toMatchPercent(score: number, maxScore: number): number {
  if (maxScore <= 0) return 40;
  const pct = Math.round(40 + (score / maxScore) * 60);
  return Math.min(100, Math.max(40, pct));
}

export function useQuiz(totalSteps: number) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<QuizDestination[]>([]);
  const [direction, setDirection] = useState(1);
  const { toast } = useToast();

  const isQuizDone = step >= totalSteps;

  const handleSelect = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (step < totalSteps - 1) {
      setDirection(1);
      setTimeout(() => setStep((s) => s + 1), 400);
    } else {
      setDirection(1);
      setStep(totalSteps);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleSwipe = (offsetX: number, currentStep: number, currentAnswers: Record<string, string>, stepKey: string) => {
    if (isQuizDone) return;
    if (offsetX < -50 && currentStep < totalSteps - 1 && currentAnswers[stepKey]) {
      setDirection(1);
      setStep((s) => s + 1);
    } else if (offsetX > 50 && currentStep > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const { data: destinations } = await supabase
        .from("destinations")
        .select("id, title, slug, short_description, difficulty_level, country, estimated_budget_usd, days_needed, hero_image_url, experience_type, region")
        .eq("is_published", true);

      const maxPossible = SCORING_RULES.reduce((max, rule) => {
        if (answers[rule.key] === rule.value) return max + rule.weight;
        return max;
      }, 0);

      const scored: QuizDestination[] = (destinations || []).map((d) => {
        const { score, matchReasons } = scoreDestination(answers, d);
        return {
          id: d.id,
          title: d.title,
          slug: d.slug,
          short_description: d.short_description,
          difficulty_level: d.difficulty_level,
          country: d.country,
          estimated_budget_usd: d.estimated_budget_usd,
          days_needed: d.days_needed,
          hero_image_url: d.hero_image_url,
          experience_type: d.experience_type,
          region: d.region,
          score,
          matchPercent: toMatchPercent(score, maxPossible),
          matchReasons,
        };
      });
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, 3);
      setResults(top);
      setShowResults(true);

      await supabase.from("quiz_responses").insert({
        fitness_level: answers.fitness_level,
        interest: answers.interest,
        trip_duration: answers.trip_duration,
        budget_range: answers.budget_range,
        recommended_destinations: top.map((d) => d.id),
      });
    } catch {
      toast({ title: "Error", description: "Algo salió mal. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [answers, toast]);

  const handleEmailSubmit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast({ title: "Email inválido", description: "Por favor ingresa un email válido.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await supabase.from("newsletter_subscribers").insert({ email, source: "quiz" }).select();
      setEmailSubmitted(true);
      toast({ title: "¡Listo! 🎉", description: "Te enviaremos aventuras personalizadas." });
    } catch {
      toast({ title: "Error", description: "Algo salió mal. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleShowEmailCapture = () => setShowEmailCapture(true);

  return {
    step, answers, email, setEmail,
    showResults, showEmailCapture, emailSubmitted,
    loading, results,
    direction, isQuizDone,
    handleSelect, handleBack, handleSwipe,
    fetchResults, handleEmailSubmit, handleShowEmailCapture,
  };
}
