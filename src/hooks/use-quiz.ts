import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface QuizOption {
  label: string;
  value: string;
  icon: React.ReactNode;
  emoji: string;
}

export interface QuizStep {
  question: string;
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
  score: number;
}

export function useQuiz(totalSteps: number) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [showResults, setShowResults] = useState(false);
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

  const handleSubmit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast({ title: "Email inválido", description: "Por favor ingresa un email válido.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: destinations } = await supabase
        .from("destinations")
        .select("id, title, slug, short_description, difficulty_level, country, estimated_budget_usd, days_needed, hero_image_url")
        .eq("is_published", true);

      const scored: QuizDestination[] = (destinations || []).map((d) => {
        let score = 0;
        if (answers.interest === "mountains" && d.difficulty_level !== "challenging") score += 2;
        if (answers.interest === "cultural" && d.slug === "camino-de-santiago") score += 3;
        if (answers.interest === "deserts" && d.slug === "gran-canon") score += 3;
        if (answers.fitness_level === "sedentary" && d.difficulty_level === "easy") score += 3;
        if (answers.fitness_level === "active" && d.difficulty_level === "challenging") score += 2;
        if (answers.trip_duration === "weekend" && d.days_needed?.includes("1")) score += 2;
        if (answers.trip_duration === "two_weeks" && d.difficulty_level === "challenging") score += 2;
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
          score,
        };
      });
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, 3);
      setResults(top);

      await supabase.from("quiz_responses").insert({
        email,
        fitness_level: answers.fitness_level,
        interest: answers.interest,
        trip_duration: answers.trip_duration,
        travel_style: answers.travel_style,
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

  return {
    step, answers, email, setEmail,
    showResults, loading, results,
    direction, isQuizDone,
    handleSelect, handleSwipe, handleSubmit,
  };
}
