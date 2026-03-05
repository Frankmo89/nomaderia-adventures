import { useEffect, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  Footprints, Map, Mountain, Shield, TreePine, Sun, Compass, Check,
  ChevronLeft, ArrowRight, Sparkles, DollarSign, Wallet, TrendingUp,
  Mail, Send, Loader2, Calendar, MapPin, HeartPulse, Backpack, Tent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import { useQuiz } from "@/hooks/use-quiz";
import type { QuizDestination, QuizStep } from "@/hooks/use-quiz";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const WHATSAPP_PHONE = "18588996802";
const AGENT_NAME = "Frank";
const ITINERARY_DISCOUNT = "10%";

const WhatsAppIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-5 w-5 shrink-0"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const difficultyColor: Record<string, string> = {
  easy: "bg-secondary text-secondary-foreground",
  moderate: "bg-primary/80 text-primary-foreground",
  challenging: "bg-destructive text-destructive-foreground",
};
const difficultyLabel: Record<string, string> = { easy: "Fácil", moderate: "Moderado", challenging: "Desafiante" };
const countryFlag: Record<string, string> = {
  México: "🇲🇽", "Estados Unidos": "🇺🇸", España: "🇪🇸", Argentina: "🇦🇷", Nepal: "🇳🇵",
};

const seasonOptions = [
  { label: "El próximo mes", value: "next_month" },
  { label: "En 3 meses", value: "three_months" },
  { label: "En 6 meses", value: "six_months" },
  { label: "Soy flexible", value: "flexible" },
];

const originOptions = [
  { label: "Tijuana / Baja California", value: "tijuana_baja" },
  { label: "San Diego / Sur de California", value: "sandiego_socal" },
  { label: "Ciudad de México (CDMX)", value: "cdmx" },
  { label: "Resto de México", value: "resto_mx" },
  { label: "Resto de Estados Unidos", value: "resto_usa" },
  { label: "Otro lugar", value: "otro" },
];

const steps: QuizStep[] = [
  {
    question: "¿Cuál es tu nivel de actividad física?",
    subtitle: "Esto nos ayuda a encontrar rutas adecuadas para ti",
    key: "fitness_level",
    options: [
      { label: "Camino poco", value: "sedentary", icon: <Footprints className="h-6 w-6 sm:h-7 sm:w-7" />, description: "Paseos cortos y tranquilos" },
      { label: "Camino seguido", value: "light_activity", icon: <Map className="h-6 w-6 sm:h-7 sm:w-7" />, description: "Caminatas de unas horas" },
      { label: "Hago ejercicio regular", value: "moderate", icon: <Mountain className="h-6 w-6 sm:h-7 sm:w-7" />, description: "Entreno varias veces por semana" },
      { label: "Soy bastante activo", value: "active", icon: <Shield className="h-6 w-6 sm:h-7 sm:w-7" />, description: "Listo para cualquier desafío" },
    ],
  },
  {
    question: "¿Qué paisaje te emociona más?",
    subtitle: "Cada paisaje ofrece una experiencia única",
    key: "interest",
    options: [
      { label: "Montañas", value: "mountains", icon: <Mountain className="h-6 w-6 sm:h-7 sm:w-7" />, description: "Cumbres, valles y aire fresco" },
      { label: "Bosques", value: "forests", icon: <TreePine className="h-6 w-6 sm:h-7 sm:w-7" />, description: "Senderos entre la naturaleza" },
      { label: "Desiertos", value: "deserts", icon: <Sun className="h-6 w-6 sm:h-7 sm:w-7" />, description: "Paisajes áridos y majestuosos" },
      { label: "Caminos Culturales", value: "cultural", icon: <Compass className="h-6 w-6 sm:h-7 sm:w-7" />, description: "Historia y tradiciones vivas" },
    ],
  },
  {
    question: "¿Cuántos días tienes?",
    subtitle: "Hay aventuras para cada agenda",
    key: "trip_duration",
    options: [
      { label: "Un fin de semana", value: "weekend", icon: <Sun className="h-6 w-6 sm:h-7 sm:w-7" />, description: "2-3 días de aventura" },
      { label: "Una semana", value: "one_week", icon: <Compass className="h-6 w-6 sm:h-7 sm:w-7" />, description: "5-7 días para explorar" },
      { label: "Dos semanas o más", value: "two_weeks", icon: <Map className="h-6 w-6 sm:h-7 sm:w-7" />, description: "Viaje largo e inmersivo" },
    ],
  },
  {
    question: "¿Qué es lo que más te frena para salir a explorar?",
    subtitle: "Nomaderia está diseñado para ayudarte con esto",
    key: "main_barrier",
    options: [
      { label: "No saber por dónde empezar", value: "lack_info", icon: <Map className="h-6 w-6 sm:h-7 sm:w-7" />, description: "Miedo a perderme o elegir mal" },
      { label: "Siento que me falta condición", value: "fitness_doubt", icon: <HeartPulse className="h-6 w-6 sm:h-7 sm:w-7" />, description: "Temor a no aguantar el ritmo" },
      { label: "No tengo el equipo adecuado", value: "no_gear", icon: <Backpack className="h-6 w-6 sm:h-7 sm:w-7" />, description: "No quiero gastar en ropa técnica" },
      { label: "Me preocupa la incomodidad", value: "comfort", icon: <Tent className="h-6 w-6 sm:h-7 sm:w-7" />, description: "Temas de baño, clima o dormir mal" },
    ],
  },
  {
    question: "¿Cuál es tu presupuesto?",
    subtitle: "Encuentra destinos que se ajusten a tu bolsillo",
    key: "budget_range",
    options: [
      { label: "Económico", value: "low", icon: <Wallet className="h-6 w-6 sm:h-7 sm:w-7" />, description: "Menos de $500 USD" },
      { label: "Moderado", value: "medium", icon: <DollarSign className="h-6 w-6 sm:h-7 sm:w-7" />, description: "$500 - $1,500 USD" },
      { label: "Premium", value: "high", icon: <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />, description: "$1,500 - $3,000 USD" },
      { label: "Sin límite", value: "unlimited", icon: <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />, description: "La aventura no tiene precio" },
    ],
  },
  {
    question: "Últimos detalles",
    subtitle: "Para afinar tus recomendaciones",
    key: "combined",
    type: "combined",
  },
];

// --- MatchRing SVG component ---
const MatchRing = ({ percent }: { percent: number }) => {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;
  const color = percent >= 80 ? "text-green-400" : percent >= 60 ? "text-primary" : "text-yellow-400";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="68" height="68" className="-rotate-90">
        <circle cx="34" cy="34" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-foreground/10" />
        <motion.circle
          cx="34" cy="34" r={r} fill="none" strokeWidth="4" strokeLinecap="round"
          className={color}
          stroke="currentColor"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-sm font-bold text-foreground">{percent}%</span>
    </div>
  );
};

// --- QuizLoading component ---
const QuizLoading = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <Loader2 className="h-12 w-12 text-primary" />
    </motion.div>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="text-muted-foreground text-base sm:text-lg font-medium"
    >
      Buscando tu aventura ideal...
    </motion.p>
    <div className="flex gap-1.5 mt-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-primary"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  </div>
);

// --- Celebration particles ---
const celebrationColors = ["bg-orange-500", "bg-emerald-600", "bg-sky-500", "bg-yellow-400"];

const CelebrationParticles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        className={`absolute w-2 h-2 rounded-full ${celebrationColors[i % celebrationColors.length]}`}
        style={{
          left: `${10 + Math.random() * 80}%`,
          top: `${Math.random() * 40}%`,
        }}
        initial={{ opacity: 0, scale: 0, y: 0 }}
        animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], y: [0, -40 - Math.random() * 60] }}
        transition={{ duration: 2, delay: 0.1 * i, repeat: 1 }}
      />
    ))}
  </div>
);

// --- EmailCapture component ---
const EmailCapture = ({
  email,
  setEmail,
  loading,
  emailSubmitted,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  emailSubmitted: boolean;
  onSubmit: () => void;
}) => {
  if (emailSubmitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
        <span className="text-3xl mb-2 block">🎉</span>
        <p className="text-foreground font-medium">¡Listo! Revisa tu correo con tus resultados y el código de descuento.</p>
      </motion.div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-50/60 dark:bg-amber-900/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border-2 border-amber-400/50 max-w-md mx-auto shadow-lg shadow-amber-500/10"
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <Mail className="h-5 w-5 text-primary" />
        <h4 className="font-serif text-lg font-bold text-foreground text-center leading-tight">
          📩 Guarda tus resultados y obtén un{" "}
          <span className="text-primary underline decoration-wavy decoration-primary/60">{ITINERARY_DISCOUNT} de DESCUENTO</span>{" "}
          en tu Itinerario Personalizado
        </h4>
      </div>
      <p className="text-muted-foreground text-sm mb-5 text-center">
        Ingresa tu email y te enviamos tus resultados + el código de descuento exclusivo.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white dark:bg-muted text-foreground h-12 text-base border-amber-300/60 focus-visible:ring-primary"
        />
        <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground whitespace-nowrap shadow-lg shadow-primary/20 h-12 px-6">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" />Quiero mi descuento</>}
        </Button>
      </form>
    </motion.div>
  );
};

// --- Sub-component: Result card ---
const ResultCard = ({ d, index }: { d: QuizDestination; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 + index * 0.2, duration: 0.6, ease: "easeOut" }}
    className={index === 0 ? "sm:col-span-3 sm:max-w-2xl sm:mx-auto" : ""}
  >
    <Link
      to={`/destinos/${d.slug}`}
      className="block rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 active:scale-[0.98] sm:hover:scale-[1.02] group bg-card border border-border"
    >
      {/* Imagen con overlays mínimos */}
      <div className={`relative overflow-hidden ${index === 0 ? "h-48 sm:h-72" : "h-40 sm:h-52"}`}>
        {d.hero_image_url ? (
          <img
            src={d.hero_image_url}
            alt={`Vista de ${d.title}`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-primary/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* MatchRing — top left */}
        <div className="absolute top-3 left-3">
          <MatchRing percent={d.matchPercent} />
        </div>

        {/* Difficulty badge — top right */}
        <div className="absolute top-3 right-3">
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${difficultyColor[d.difficulty_level]}`}>
            {difficultyLabel[d.difficulty_level]}
          </span>
        </div>
      </div>

      {/* Contenido debajo de la imagen */}
      <div className="p-4 sm:p-5 space-y-2.5">
        <h3
          className={`font-serif font-bold text-foreground leading-tight ${
            index === 0 ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
          }`}
        >
          {d.title}
        </h3>

        <p className="text-sm text-muted-foreground">
          {(() => {
            const countryLabel = `${countryFlag[d.country] ?? ""} ${d.country}`.trim();
            const daysLabel = d.days_needed ?? "—";
            const budgetLabel =
              d.estimated_budget_usd != null
                ? `~$${new Intl.NumberFormat("en-US", {
                    maximumFractionDigits: 0,
                  }).format(d.estimated_budget_usd)} USD`
                : null;
            return [countryLabel, daysLabel, budgetLabel].filter(Boolean).join(" · ");
          })()}
        </p>

        {d.matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Razones de match">
            {d.matchReasons.slice(0, 2).map((reason, ri) => (
              <span
                key={ri}
                className="text-xs bg-primary/15 text-primary px-2.5 py-0.5 rounded-full"
              >
                {reason}
              </span>
            ))}
          </div>
        )}

        {d.short_description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {d.short_description}
          </p>
        )}

        <span className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-primary/30 transition-colors mt-1">
          Ver Guía Completa <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  </motion.div>
);

// --- Sub-component: Results view ---
const QuizResults = ({
  results,
  email,
  setEmail,
  loading,
  emailSubmitted,
  onEmailSubmit,
}: {
  results: QuizDestination[];
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  emailSubmitted: boolean;
  onEmailSubmit: () => void;
}) => {
  const topDestination = results[0];
  const whatsAppUrl = topDestination
    ? buildWhatsAppUrl(
        `Hola ${AGENT_NAME}, acabo de hacer el Quiz, mi destino ideal es ${topDestination.title} y me interesa un itinerario personalizado. ¿Qué paquetes tienes?`,
        WHATSAPP_PHONE,
      )
    : undefined;

  return (
    <section id="quiz" className="py-16 sm:py-24 bg-background relative overflow-hidden">
      <CelebrationParticles />
      <div className="absolute inset-0 opacity-[0.04] bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=60)` }} />
      <div className="container mx-auto px-5 max-w-5xl relative z-10">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }} className="text-center mb-10 sm:mb-14">
          <span className="text-5xl sm:text-6xl mb-4 block">🏔️</span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3">
            🎉 ¡Tu Aventura Ideal!
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Basado en tus respuestas, estos destinos son perfectos para ti
          </p>
        </motion.div>
        <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6">
          {results.map((d, i) => <ResultCard key={d.id} d={d} index={i} />)}
        </div>

        {/* WhatsApp CTA — primary conversion action */}
        {whatsAppUrl && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5, ease: "easeOut" }}
            className="mt-10 sm:mt-12 flex justify-center"
          >
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-lg sm:text-xl px-8 py-5 rounded-2xl shadow-2xl shadow-green-700/40 transition-all duration-200 active:scale-[0.97] sm:hover:scale-[1.03] w-full max-w-md"
            >
              <WhatsAppIcon />
              Quiero que {AGENT_NAME} planifique mi viaje 💬
            </a>
          </motion.div>
        )}

        {/* Email capture — always visible, discount offer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-6 sm:mt-8"
        >
          <EmailCapture
            email={email}
            setEmail={setEmail}
            loading={loading}
            emailSubmitted={emailSubmitted}
            onSubmit={onEmailSubmit}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
          className="mt-8 sm:mt-10 text-center">
          <a href="#destinos" className="text-primary hover:underline font-medium text-sm sm:text-base block">
            ¿Ninguno te convence? Explora todos los destinos →
          </a>
        </motion.div>
      </div>
    </section>
  );
};

// --- Main component ---
const QuizSection = () => {
  const {
    step, answers, email, setEmail,
    showResults, emailSubmitted,
    loading, results,
    direction, isQuizDone,
    handleSelect, handleBack, handleSwipe,
    fetchResults, handleEmailSubmit,
    handleCombinedSubmit,
  } = useQuiz(steps.length);

  const [combinedSeason, setCombinedSeason] = useState("");
  const [combinedOrigin, setCombinedOrigin] = useState("");

  useEffect(() => {
    if (isQuizDone && !showResults && !loading) {
      fetchResults();
    }
  }, [isQuizDone, showResults, loading, fetchResults]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    handleSwipe(info.offset.x, step, answers, steps[step]?.key ?? "");
  };

  const currentStep = steps[Math.min(step, steps.length - 1)];
  const isCombinedStep = currentStep?.type === "combined";

  const dragProps = isCombinedStep ? {} : {
    drag: "x" as const,
    dragConstraints: { left: 0, right: 0 },
    dragElastic: 0.15,
    onDragEnd,
  };

  const onCombinedSubmit = () => {
    if (!combinedSeason || !combinedOrigin) return;
    handleCombinedSubmit({ season: combinedSeason, origin: combinedOrigin });
  };

  if (loading && !showResults) return (
    <section id="quiz" className="py-16 sm:py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/6 blur-3xl" />
      </div>
      <div className="container mx-auto px-5 max-w-2xl relative z-10">
        <QuizLoading />
      </div>
    </section>
  );

  if (showResults) return (
    <QuizResults
      results={results}
      email={email}
      setEmail={setEmail}
      loading={loading}
      emailSubmitted={emailSubmitted}
      onEmailSubmit={handleEmailSubmit}
    />
  );

  return (
    <section id="quiz" className="py-16 sm:py-24 bg-background relative overflow-hidden">
      {/* Atmospheric glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/6 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full bg-accent/4 blur-3xl" />
      </div>

      <div className="container mx-auto px-5 max-w-2xl relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-8 sm:mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Cuestionario personalizado · 1 minuto
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
            ¿No Sabes A Dónde Ir?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Responde {steps.length} preguntas y te decimos tu destino ideal
          </p>
        </motion.div>

        {/* Numbered step indicator */}
        <div className="flex items-center justify-center mb-8 sm:mb-10">
          {steps.map((_, i) => (
            <div key={i} className="flex items-center">
              <motion.div
                animate={{
                  scale: i === step ? 1.15 : 1,
                  transition: { duration: 0.25 },
                }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 shrink-0",
                  i < step
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                    : i === step
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg shadow-primary/25"
                    : "bg-background border-2 border-border text-muted-foreground"
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </motion.div>
              {i < steps.length - 1 && (
                <motion.div
                  className="h-[2px] w-6 sm:w-8 transition-all duration-500"
                  animate={{ backgroundColor: i < step ? "hsl(var(--primary))" : "hsl(var(--border))" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Glass card */}
        <div className="bg-card/50 backdrop-blur-md border border-border/70 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-background/60">
          {/* Card top bar: back button + step label */}
          <div className="flex items-center justify-between mb-5">
            <AnimatePresence>
              {step > 0 && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <Button variant="ghost" size="sm" onClick={handleBack}
                    className="text-muted-foreground hover:text-foreground -ml-2 gap-1">
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <span aria-live="polite" aria-atomic="true" className="ml-auto text-xs font-medium text-muted-foreground tracking-wide">
              Pregunta {Math.min(step + 1, steps.length)} de {steps.length}
            </span>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={step} custom={direction}
              initial={{ opacity: 0, x: direction * 60 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }} transition={{ duration: 0.3 }}
              {...dragProps}>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-1.5">
                {currentStep?.question}
              </h3>
              {currentStep?.subtitle && (
                <p className="text-muted-foreground text-sm mb-6">
                  {currentStep.subtitle}
                </p>
              )}

              {isCombinedStep ? (
                <div className="space-y-5 mt-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      ¿Cuándo te gustaría ir?
                    </label>
                    <Select value={combinedSeason} onValueChange={setCombinedSeason}>
                      <SelectTrigger className="bg-muted border-border text-foreground h-11">
                        <SelectValue placeholder="Selecciona temporada" />
                      </SelectTrigger>
                      <SelectContent>
                        {seasonOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      ¿Desde qué zona viajarías?
                    </label>
                    <Select value={combinedOrigin} onValueChange={setCombinedOrigin}>
                      <SelectTrigger className="bg-muted border-border text-foreground h-11">
                        <SelectValue placeholder="Selecciona tu zona" />
                      </SelectTrigger>
                      <SelectContent>
                        {originOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={onCombinedSubmit}
                    disabled={!combinedSeason || !combinedOrigin}
                    className="w-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 h-11 mt-2"
                  >
                    Ver Mis Resultados <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 mt-5">
                  {currentStep?.options?.map((opt) => {
                    const isSelected = answers[currentStep.key] === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        onClick={() => handleSelect(currentStep.key, opt.value)}
                        whileTap={{ scale: 0.985 }}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left group",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        )}
                      >
                        {/* Icon tile */}
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all duration-200",
                          isSelected ? "bg-primary/20" : "bg-muted group-hover:bg-muted/80"
                        )}>
                          {opt.icon}
                        </div>

                        {/* Label + description */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-foreground leading-snug">
                            {opt.label}
                          </p>
                          {opt.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                              {opt.description}
                            </p>
                          )}
                        </div>

                        {/* Selection indicator */}
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200",
                          isSelected ? "border-primary bg-primary" : "border-border"
                        )}>
                          {isSelected && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {!isCombinedStep && (
                <p className="text-xs text-muted-foreground mt-5 text-center sm:hidden">← Desliza para navegar →</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default QuizSection;
