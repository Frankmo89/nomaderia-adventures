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
  type?: "combined";
  options?: QuizOption[];
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
  tags: string[] | null;
  best_season: string | null;
  score: number;
  matchPercent: number;
  matchReasons: string[];
}

type DestinationFields = {
  id: string;
  title: string;
  experience_type: string | null;
  difficulty_level: string;
  short_description: string | null;
  estimated_budget_usd: number | null;
  days_needed: string | null;
  country: string;
  region: string | null;
  tags: string[] | null;
  best_season: string | null;
};

const SCORING_RULES: Record<string, (answer: string, dest: DestinationFields) => { points: number; reason: string }> = {
  fitness_level: (answer, dest) => {
    const diffMap: Record<string, string[]> = {
      sedentary: ["easy"],
      light_activity: ["easy", "moderate"],
      moderate: ["moderate", "challenging"],
      active: ["challenging"],
    };
    const allowed = diffMap[answer] || [];
    if (allowed.includes(dest.difficulty_level)) {
      if (answer === "sedentary") {
        return { points: 3, reason: "Nivel de dificultad ideal para tu condición actual" };
      }
      if (answer === "light_activity") {
        return { points: 2, reason: "Dificultad moderada, perfecta para ti" };
      }
      if (answer === "moderate") {
        return { points: 2, reason: "Buen reto para tu nivel de actividad" };
      }
      if (answer === "active") {
        return { points: 3, reason: "Aventura desafiante a la altura de tu energía" };
      }
    }
    return { points: 0, reason: "" };
  },

  interest: (answer, dest) => {
    const typeMap: Record<string, string[]> = {
      mountains: ["trekking", "mountaineering", "hiking", "montaña", "glaciar"],
      forests: ["trekking", "hiking", "nature", "bosque", "selva"],
      deserts: ["desert", "canyon", "rock", "desierto"],
      cultural: ["cultural", "pilgrimage", "camino", "históric"],
    };

    const keywords = typeMap[answer] || [];
    const destText = `${dest.experience_type || ""} ${dest.short_description || ""} ${dest.title || ""}`.toLowerCase();
    const textMatch = keywords.some((k) => destText.includes(k));

    // Also check tags array
    const destTags = (dest.tags || []).map((t: string) => t.toLowerCase());
    const tagMatch = keywords.some((k) => destTags.some((tag: string) => tag.includes(k)));

    const geoHints: Record<string, string[]> = {
      mountains: ["patagonia", "nepal", "andes", "sierra", "torres"],
      forests: ["bosque", "selva", "forest"],
      deserts: ["desierto", "joshua", "cañón", "canyon", "gran cañón"],
      cultural: ["santiago", "camino", "cultural"],
    };
    const geoMatch = (geoHints[answer] || []).some((k) => destText.includes(k));

    if (tagMatch) {
      return { points: 5, reason: "El paisaje que buscas" };
    }
    if (textMatch || geoMatch) {
      return { points: 4, reason: "El paisaje que buscas" };
    }
    return { points: 0, reason: "" };
  },

  trip_duration: (answer, dest) => {
    const parseDays = (value: unknown): number => {
      if (value == null) return NaN;
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const match = value.match(/\d+/);
        if (match) {
          const parsed = parseInt(match[0], 10);
          return Number.isNaN(parsed) ? NaN : parsed;
        }
      }
      return NaN;
    };

    const days = parseDays(dest.days_needed);
    if (answer === "weekend") {
      if (!isNaN(days) && days <= 3) {
        return { points: 2, reason: "Perfecto para escapada corta" };
      }
      const desc = dest.short_description?.toLowerCase() ?? "";
      if (desc.includes("1 día") || desc.includes("2 día") || desc.includes("fin de semana")) {
        return { points: 2, reason: "Perfecto para escapada corta" };
      }
    } else if (answer === "one_week") {
      if (!isNaN(days) && days >= 4 && days <= 8) {
        return { points: 2, reason: "Ideal para una semana" };
      }
    } else if (answer === "two_weeks") {
      if (!isNaN(days) && days >= 9 && days <= 16) {
        return { points: 2, reason: "Aventura extendida perfecta" };
      }
    }
    return { points: 0, reason: "" };
  },

  budget: (answer, dest) => {
    const budget = dest.estimated_budget_usd;
    if (budget == null) return { points: 0, reason: "" };
    if (answer === "low" && budget <= 500) return { points: 2, reason: "Dentro de tu presupuesto" };
    if (answer === "medium" && budget > 500 && budget <= 1500) return { points: 2, reason: "Presupuesto moderado ideal" };
    if (answer === "high" && budget > 1500 && budget <= 3000) return { points: 2, reason: "Gran aventura, buena inversión" };
    if (answer === "unlimited" && budget > 3000) return { points: 1, reason: "Sin límite de presupuesto" };
    return { points: 0, reason: "" };
  },

  season: (answer, dest) => {
    const bestSeason = (dest.best_season || "").toLowerCase();
    if (!bestSeason || answer === "flexible") return { points: 1, reason: "" };

    const now = new Date();
    const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

    let targetMonth = "";
    if (answer === "next_month") {
      targetMonth = monthNames[(now.getMonth() + 1) % 12];
    } else if (answer === "three_months") {
      targetMonth = monthNames[(now.getMonth() + 3) % 12];
    } else if (answer === "six_months") {
      targetMonth = monthNames[(now.getMonth() + 6) % 12];
    }

    if (!targetMonth) return { points: 1, reason: "" };

    if (bestSeason.includes(targetMonth)) {
      return { points: 3, reason: "Temporada perfecta" };
    }

    // Check if nearby months match
    const targetIdx = monthNames.indexOf(targetMonth);
    const nearbyMonths = [
      monthNames[(targetIdx + 1) % 12],
      monthNames[(targetIdx + 11) % 12],
    ];
    if (nearbyMonths.some((m) => bestSeason.includes(m))) {
      return { points: 1, reason: "" };
    }

    return { points: -1, reason: "" };
  },

  origin: (answer, dest) => {
    const country = (dest.country || "").toLowerCase();
    const region = (dest.region || "").toLowerCase();
    const title = (dest.title || "").toLowerCase();

    // Proximity scoring by origin zone
    const proximityMap: Record<string, string[]> = {
      mx_border: ["estados unidos", "usa", "joshua", "gran cañón", "yosemite", "anza-borrego", "california"],
      mx_center: ["méxico", "nevado", "toluca"],
      mx_south: ["méxico"],
      us_southwest: ["estados unidos", "usa", "joshua", "gran cañón", "yosemite", "anza-borrego", "california"],
      us_other: ["estados unidos", "usa"],
      spain: ["españa", "camino", "santiago", "europa"],
      south_america: ["chile", "argentina", "patagonia", "torres del paine", "ushuaia", "perú", "colombia"],
      other: [],
    };

    const nearby = proximityMap[answer] || [];
    const destText = `${country} ${region} ${title}`;

    if (nearby.some((k) => destText.includes(k))) {
      return { points: 2, reason: "Cerca de ti" };
    }
    return { points: 0, reason: "" };
  },
};

// Maximum achievable score: fitness:3 + interest:5 + trip_duration:2 + budget:2 + season:3 + origin:2
const MAX_SCORE = 17;

function scoreDestination(
  answers: Record<string, string>,
  d: DestinationFields
): { score: number; matchReasons: string[] } {
  let score = 0;
  const matchReasons: string[] = [];

  for (const [key, ruleFn] of Object.entries(SCORING_RULES)) {
    const answer = answers[key];
    if (!answer) continue;
    const { points, reason } = ruleFn(answer, d);
    score += points;
    if (reason && !matchReasons.includes(reason)) {
      matchReasons.push(reason);
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
        .select("id, title, slug, short_description, difficulty_level, country, estimated_budget_usd, days_needed, hero_image_url, experience_type, region, tags, best_season")
        .eq("is_published", true);

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
          tags: d.tags ?? null,
          best_season: d.best_season ?? null,
          score,
          matchPercent: toMatchPercent(score, MAX_SCORE),
          matchReasons,
        };
      });
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, 3);
      setResults(top);
      setShowResults(true);
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
      await supabase.from("quiz_responses").insert({
        email,
        fitness_level: answers.fitness_level,
        interest: answers.interest,
        trip_duration: answers.trip_duration,
        travel_style: answers.origin || null,
        budget_range: answers.budget_range ?? answers.budget ?? null,
        recommended_destinations: results.map((d) => d.id),
      });
      // Enviar email con resultados del quiz
      if (!results || results.length === 0) {
        // Evitar llamar a la Edge Function sin destinos válidos
        console.warn("Omitiendo envío de email: no hay destinos recomendados para incluir.");
      } else {
        try {
          await supabase.functions.invoke("send-quiz-email", {
            body: {
              email,
              destinations: results.map((d) => ({
                title: d.title,
                slug: d.slug,
                short_description: d.short_description,
                country: d.country,
                estimated_budget_usd: d.estimated_budget_usd,
                days_needed: d.days_needed,
                hero_image_url: d.hero_image_url,
                difficulty_level: d.difficulty_level,
              })),
              fitness_level: answers.fitness_level,
              interest: answers.interest,
            },
          });
        } catch (emailError) {
          // No bloquear la UI si el email falla
          console.error("Error enviando email:", emailError);
        }
      }
      setEmailSubmitted(true);
      toast({ title: "¡Resultados listos! 📧", description: "También te enviamos los resultados a tu email." });
    } catch {
      toast({ title: "Error", description: "Algo salió mal. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleShowEmailCapture = () => setShowEmailCapture(true);

  const handleCombinedSubmit = (fields: Record<string, string>) => {
    setAnswers((prev) => ({ ...prev, ...fields }));
    setDirection(1);
    setStep(totalSteps);
  };

  return {
    step, answers, email, setEmail,
    showResults, showEmailCapture, emailSubmitted,
    loading, results,
    direction, isQuizDone,
    handleSelect, handleBack, handleSwipe,
    fetchResults, handleEmailSubmit, handleShowEmailCapture,
    handleCombinedSubmit,
  };
}
