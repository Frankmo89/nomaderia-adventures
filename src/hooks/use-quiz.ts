import { useState, useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logEvent } from "@/lib/events";
import {
  InvalidProfileError,
  rankQuizDestinations,
  type QuizDestinationRow,
  type TripProfile,
} from "@/lib/quiz-ranking";

export interface QuizOption {
  label: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
}

export type QuizStepType = "options" | "combined" | "dates" | "group";

export interface QuizStep {
  question: string;
  subtitle?: string;
  key: string;
  type?: QuizStepType;
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
  park_code: string | null;
  score: number;
  /** Engine `match_percent` (fit score, not a probability). */
  matchPercent: number;
  matchReasons: string[];
  rank: number;
  /** Contract §3: within tie_epsilon of a neighbor — a close call, not a clear winner. */
  tiedWithNeighbors: boolean;
}

export interface QuizPreview {
  day1_plan: string;
  entry_cost: string;
  alerts_summary: string;
  alerts_available: boolean;
  synced_at: string | null;
  park_code: string;
  park_title: string;
  /** Engine version the Edge Function ran; compare with the client's for deploy skew. */
  engine_version?: string | null;
  engine_mismatch?: boolean;
  /** True when the Edge Function re-ran the engine and found this park in its output. */
  engine_verified?: boolean;
}

interface RankingMeta {
  profile: TripProfile;
  engine_version: string;
  candidate_park_codes: string[];
}

const QUIZ_SELECT =
  "id, title, slug, short_description, difficulty_level, country, estimated_budget_usd, days_needed, hero_image_url, experience_type, region, tags, best_season, park_code, latitude, longitude, requires_permit";

function getSessionIdForLead(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem("nomaderia_session_id");
  } catch {
    return null;
  }
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
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [preview, setPreview] = useState<QuizPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [rankingMeta, setRankingMeta] = useState<RankingMeta | null>(null);
  const { toast } = useToast();

  const isQuizDone = step >= totalSteps;

  const advanceAfterAnswer = () => {
    if (step < totalSteps - 1) {
      setDirection(1);
      setTimeout(() => setStep((s) => s + 1), 400);
    } else {
      setDirection(1);
      setStep(totalSteps);
    }
  };

  const handleSelect = (key: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "start_city") next.origin = value;
      return next;
    });
    logEvent("quiz_answer", { key, value });
    advanceAfterAnswer();
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

  const loadPreview = useCallback(async (
    dest: QuizDestination,
    quizAnswers: Record<string, string>,
    meta: RankingMeta | null,
  ) => {
    if (!dest.park_code) {
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<QuizPreview>("quiz-preview", {
        body: {
          park_code: dest.park_code,
          destination_slug: dest.slug,
          destination_title: dest.title,
          fitness_level: quizAnswers.fitness_level,
          lodging: quizAnswers.lodging,
          trip_duration: quizAnswers.trip_duration,
          // Lets the Edge Function re-run the same engine over the same candidates (contract §6.1).
          profile: meta?.profile ?? null,
          engine_version: meta?.engine_version ?? null,
          candidate_park_codes: meta?.candidate_park_codes ?? null,
        },
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (error) throw new Error(error.message);
      if (data && !("error" in data)) {
        if (data.engine_mismatch) {
          console.warn("[quiz-preview] engine_version skew: client", meta?.engine_version, "server", data.engine_version);
        }
        setPreview(data);
      } else {
        setPreview(null);
      }
    } catch (err) {
      console.warn("[quiz-preview]", err);
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const { data: destinations, error } = await supabase
        .from("destinations")
        .select(QUIZ_SELECT)
        .eq("is_published", true);

      if (error) throw error;

      const rows = (destinations ?? []) as QuizDestinationRow[];
      const outcome = rankQuizDestinations(rows, answers, 3);

      const top: QuizDestination[] = outcome.results.map(({ destination, ranked: r, matchPercent, reasons }) => ({
        id: destination.id,
        title: destination.title,
        slug: destination.slug,
        short_description: destination.short_description,
        difficulty_level: destination.difficulty_level,
        country: destination.country,
        estimated_budget_usd: destination.estimated_budget_usd,
        days_needed: destination.days_needed,
        hero_image_url: destination.hero_image_url,
        experience_type: destination.experience_type,
        region: destination.region,
        tags: destination.tags ?? null,
        best_season: destination.best_season ?? null,
        park_code: destination.park_code,
        score: r.score,
        matchPercent,
        matchReasons: reasons,
        rank: r.rank,
        tiedWithNeighbors: r.tied_with_neighbors,
      }));

      const meta: RankingMeta = {
        profile: outcome.profile,
        engine_version: outcome.engine_version,
        candidate_park_codes: outcome.candidate_park_codes,
      };
      setRankingMeta(meta);
      setResults(top);
      setShowResults(true);

      logEvent("quiz_results_ranked", {
        engine_version: outcome.engine_version,
        content_hash: outcome.content_hash,
        top_park_codes: top.map((d) => d.park_code).filter(Boolean),
        tie_groups: outcome.tie_groups,
        relaxed_drive_filter: outcome.relaxed_drive_filter,
        candidate_count: outcome.candidate_park_codes.length,
      });

      const first = top[0] ?? null;
      if (first) {
        setSelectedDestinationId(first.id);
        logEvent("park_selected", {
          park_code: first.park_code,
          destination_id: first.id,
          slug: first.slug,
          title: first.title,
          source: "auto_top_result",
        });
        void loadPreview(first, answers, meta);
      }
    } catch (err) {
      if (err instanceof InvalidProfileError) {
        console.warn("[quiz] invalid engine profile:", err.message);
      }
      toast({ title: "Error", description: "Algo salió mal. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [answers, toast, loadPreview]);

  const selectPark = useCallback((destinationId: string) => {
    const dest = results.find((d) => d.id === destinationId);
    if (!dest) return;
    setSelectedDestinationId(destinationId);
    logEvent(
      "park_selected",
      {
        park_code: dest.park_code,
        destination_id: dest.id,
        slug: dest.slug,
        title: dest.title,
        source: "user_choice",
      },
      leadId,
    );
    void loadPreview(dest, answers, rankingMeta);
  }, [results, leadId, loadPreview, answers, rankingMeta]);

  const handleEmailSubmit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast({ title: "Email inválido", description: "Por favor ingresa un email válido.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const newLeadId = crypto.randomUUID();
      const selected = results.find((d) => d.id === selectedDestinationId) ?? results[0] ?? null;

      const db = supabase as unknown as SupabaseClient;
      // Insert lead — never SELECT it back (client keeps newLeadId).
      const { error: leadError } = await db.from("leads").insert({
        id: newLeadId,
        email,
        session_id: getSessionIdForLead(),
        selected_park_code: selected?.park_code ?? null,
        selected_destination_id: selected?.id ?? null,
        quiz_answers: answers,
        top_park_codes: results.map((d) => d.park_code).filter((c): c is string => Boolean(c)),
      });
      if (leadError) {
        console.warn("[leads] insert failed:", leadError.message);
      } else {
        setLeadId(newLeadId);
        logEvent(
          "lead_created",
          {
            email_captured: true,
            selected_park_code: selected?.park_code ?? null,
            selected_destination_id: selected?.id ?? null,
            top_park_codes: results.map((d) => d.park_code).filter(Boolean),
          },
          newLeadId,
        );
      }

      await supabase.from("newsletter_subscribers").insert({ email, source: "quiz" }).select();
      // Cast needed until types are regenerated to include is_us_resident (ADR-009 pattern)
      await (supabase as unknown as SupabaseClient).from("quiz_responses").insert({
        email,
        fitness_level: answers.fitness_level,
        interest: answers.interest,
        trip_duration: answers.trip_duration,
        travel_style: answers.start_city || answers.origin || null,
        budget_range: answers.budget_range ?? answers.budget ?? null,
        main_barrier: answers.main_barrier || null,
        recommended_destinations: results.map((d) => d.id),
        is_us_resident: answers.is_us_resident !== undefined ? answers.is_us_resident === "true" : null,
      });
      logEvent(
        "quiz_completed",
        {
          email_captured: true,
          lead_id: newLeadId,
          start_city: answers.start_city ?? null,
          trip_start_date: answers.trip_start_date ?? null,
          trip_end_date: answers.trip_end_date ?? null,
          group_kids: answers.group_kids ?? null,
          group_older_adults: answers.group_older_adults ?? null,
          group_visitors_abroad: answers.group_visitors_abroad ?? null,
          lodging: answers.lodging ?? null,
          fitness_level: answers.fitness_level ?? null,
          budget_range: answers.budget_range ?? null,
          top_destination_ids: results.map((d) => d.id),
          top_park_codes: results.map((d) => d.park_code).filter(Boolean),
          selected_park_code: selected?.park_code ?? null,
          engine_version: rankingMeta?.engine_version ?? null,
        },
        newLeadId,
      );
      if (results.length > 0) {
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
        } catch {
          // No bloquear la UI si el email falla
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
    for (const [key, value] of Object.entries(fields)) {
      logEvent("quiz_answer", { key, value });
    }
    setDirection(1);
    setStep(totalSteps);
  };

  /** Advance from multi-field steps (dates, group) without breaking single-select flow. */
  const handleFieldsSubmit = (fields: Record<string, string>) => {
    setAnswers((prev) => ({ ...prev, ...fields }));
    for (const [key, value] of Object.entries(fields)) {
      logEvent("quiz_answer", { key, value });
    }
    advanceAfterAnswer();
  };

  return {
    step, answers, email, setEmail,
    showResults, showEmailCapture, emailSubmitted,
    loading, results,
    direction, isQuizDone,
    selectedDestinationId, selectPark,
    leadId, preview, previewLoading,
    handleSelect, handleBack, handleSwipe,
    fetchResults, handleEmailSubmit, handleShowEmailCapture,
    handleCombinedSubmit, handleFieldsSubmit,
  };
}
