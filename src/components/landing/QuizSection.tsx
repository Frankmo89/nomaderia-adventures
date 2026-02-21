import { useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  Footprints, Map, Mountain, Shield, TreePine, Sun, Compass, Check,
  ChevronLeft, ArrowRight, Sparkles, DollarSign, Wallet, TrendingUp,
  Mail, Send, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useQuiz } from "@/hooks/use-quiz";
import type { QuizDestination, QuizStep } from "@/hooks/use-quiz";

const difficultyColor: Record<string, string> = {
  easy: "bg-secondary text-secondary-foreground",
  moderate: "bg-primary/80 text-primary-foreground",
  challenging: "bg-destructive text-destructive-foreground",
};
const difficultyLabel: Record<string, string> = { easy: "Fácil", moderate: "Moderado", challenging: "Desafiante" };
const countryFlag: Record<string, string> = {
  México: "🇲🇽", "Estados Unidos": "🇺🇸", España: "🇪🇸", Argentina: "🇦🇷", Nepal: "🇳🇵",
};

const steps: QuizStep[] = [
  {
    question: "¿Cuál es tu nivel de actividad física?",
    subtitle: "Esto nos ayuda a encontrar rutas adecuadas para ti",
    key: "fitness_level",
    options: [
      { label: "Camino poco", value: "sedentary", icon: <Footprints className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🚶", description: "Paseos cortos y tranquilos" },
      { label: "Camino seguido", value: "light_activity", icon: <Map className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🏃", description: "Caminatas de unas horas" },
      { label: "Hago ejercicio regular", value: "moderate", icon: <Mountain className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "💪", description: "Entreno varias veces por semana" },
      { label: "Soy bastante activo", value: "active", icon: <Shield className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🔥", description: "Listo para cualquier desafío" },
    ],
  },
  {
    question: "¿Qué paisaje te emociona más?",
    subtitle: "Cada paisaje ofrece una experiencia única",
    key: "interest",
    options: [
      { label: "Montañas", value: "mountains", icon: <Mountain className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🏔️", description: "Cumbres, valles y aire fresco" },
      { label: "Bosques", value: "forests", icon: <TreePine className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🌲", description: "Senderos entre la naturaleza" },
      { label: "Desiertos", value: "deserts", icon: <Sun className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🏜️", description: "Paisajes áridos y majestuosos" },
      { label: "Caminos Culturales", value: "cultural", icon: <Compass className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🏛️", description: "Historia y tradiciones vivas" },
    ],
  },
  {
    question: "¿Cuántos días tienes?",
    subtitle: "Hay aventuras para cada agenda",
    key: "trip_duration",
    options: [
      { label: "Un fin de semana", value: "weekend", icon: <Sun className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "📅", description: "2-3 días de aventura" },
      { label: "Una semana", value: "one_week", icon: <Compass className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🗓️", description: "5-7 días para explorar" },
      { label: "Dos semanas o más", value: "two_weeks", icon: <Map className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "🌍", description: "Viaje largo e inmersivo" },
    ],
  },
  {
    question: "¿Cuál es tu presupuesto?",
    subtitle: "Encuentra destinos que se ajusten a tu bolsillo",
    key: "budget_range",
    options: [
      { label: "Económico", value: "low", icon: <Wallet className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "💰", description: "Menos de $500 USD" },
      { label: "Moderado", value: "medium", icon: <DollarSign className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "💵", description: "$500 - $1,500 USD" },
      { label: "Premium", value: "high", icon: <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "💎", description: "$1,500 - $3,000 USD" },
      { label: "Sin límite", value: "unlimited", icon: <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />, emoji: "✨", description: "La aventura no tiene precio" },
    ],
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
const CelebrationParticles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full"
        style={{
          left: `${10 + Math.random() * 80}%`,
          top: `${Math.random() * 40}%`,
          backgroundColor: ["#E86C3A", "#4A7C59", "#6BA3BE", "#FFD700"][i % 4],
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
        <p className="text-foreground font-medium">¡Gracias! Te enviaremos aventuras personalizadas.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 sm:mt-10 bg-card/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-border max-w-md mx-auto"
    >
      <div className="flex items-center justify-center gap-2 mb-3">
        <Mail className="h-5 w-5 text-primary" />
        <h4 className="font-serif text-lg font-semibold text-foreground">¿Quieres más recomendaciones?</h4>
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        Recibe aventuras personalizadas en tu inbox
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-muted text-foreground h-11 text-base"
        />
        <Button onClick={onSubmit} disabled={loading} className="bg-primary text-primary-foreground whitespace-nowrap shadow-lg shadow-primary/20 h-11">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" />Enviar</>}
        </Button>
      </div>
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
      className="block rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 active:scale-[0.98] sm:hover:scale-[1.02] group relative"
    >
      <div className={`relative overflow-hidden ${index === 0 ? "h-64 sm:h-80" : "h-52 sm:h-56"}`}>
        {d.hero_image_url ? (
          <img src={d.hero_image_url} alt={`Vista de ${d.title}`} loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-primary/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute top-4 left-4">
          <MatchRing percent={d.matchPercent} />
        </div>
        <div className="absolute top-4 right-4">
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${difficultyColor[d.difficulty_level]}`}>
            {difficultyLabel[d.difficulty_level]}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          <h3 className={`font-serif font-bold text-foreground mb-1 ${index === 0 ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
            {d.title}
          </h3>
          <p className="text-sm text-foreground/80 mb-2" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>
            {countryFlag[d.country] ?? ""} {d.country} · {d.days_needed} · ~${d.estimated_budget_usd} USD
          </p>
          {d.matchReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3" aria-label="Razones de match">
              {d.matchReasons.slice(0, 2).map((reason, ri) => (
                <span key={ri} className="text-xs bg-primary/20 text-primary-foreground/90 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {reason}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm text-foreground/70 line-clamp-2 mb-4" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
            {d.short_description}
          </p>
          <span className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-primary/30 transition-colors">
            Ver Guía Completa <ArrowRight className="h-4 w-4" />
          </span>
        </div>
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
  showEmailCapture,
  onShowEmailCapture,
  onEmailSubmit,
}: {
  results: QuizDestination[];
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  emailSubmitted: boolean;
  showEmailCapture: boolean;
  onShowEmailCapture: () => void;
  onEmailSubmit: () => void;
}) => (
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        className="mt-10 sm:mt-14 text-center space-y-3">
        <a href="#destinos" className="text-primary hover:underline font-medium text-sm sm:text-base block">
          ¿Ninguno te convence? Explora todos los destinos →
        </a>
        {!showEmailCapture && !emailSubmitted && (
          <Button variant="ghost" onClick={onShowEmailCapture} className="text-muted-foreground hover:text-foreground text-sm">
            <Mail className="h-4 w-4 mr-2" />Recibir más recomendaciones por email
          </Button>
        )}
        {(showEmailCapture || emailSubmitted) && (
          <EmailCapture
            email={email}
            setEmail={setEmail}
            loading={loading}
            emailSubmitted={emailSubmitted}
            onSubmit={onEmailSubmit}
          />
        )}
      </motion.div>
    </div>
  </section>
);

// --- Main component ---
const QuizSection = () => {
  const {
    step, answers, email, setEmail,
    showResults, showEmailCapture, emailSubmitted,
    loading, results,
    direction, isQuizDone,
    handleSelect, handleBack, handleSwipe,
    fetchResults, handleEmailSubmit, handleShowEmailCapture,
  } = useQuiz(steps.length);

  useEffect(() => {
    if (isQuizDone && !showResults && !loading) {
      fetchResults();
    }
  }, [isQuizDone, showResults, loading, fetchResults]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    handleSwipe(info.offset.x, step, answers, steps[step]?.key ?? "");
  };

  if (loading && !showResults) return (
    <section id="quiz" className="py-16 sm:py-20 bg-background relative overflow-hidden">
      <div className="container mx-auto px-5 max-w-2xl">
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
      showEmailCapture={showEmailCapture}
      onShowEmailCapture={handleShowEmailCapture}
      onEmailSubmit={handleEmailSubmit}
    />
  );

  return (
    <section id="quiz" className="py-16 sm:py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06] bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=60)` }} />
      <div className="container mx-auto px-5 max-w-2xl text-center relative z-10">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
          ¿No Sabes A Dónde Ir?
        </motion.h2>
        <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
          Responde {steps.length} preguntas y te recomendamos tu aventura ideal
        </p>

        <div className="w-full bg-border rounded-full h-3 sm:h-2 mb-8 sm:mb-10">
          <motion.div className="bg-primary h-3 sm:h-2 rounded-full"
            animate={{ width: `${((isQuizDone ? steps.length : step) / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }} />
        </div>

        <div className="flex justify-center gap-2 mb-6 sm:hidden">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-primary" : i < step ? "w-2 bg-primary/50" : "w-2 bg-foreground/20"}`} />
          ))}
        </div>

        {step > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-4">
            <Button variant="ghost" size="sm" onClick={handleBack} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
          </motion.div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction}
            initial={{ opacity: 0, x: direction * 80 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -80 }} transition={{ duration: 0.35 }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={onDragEnd}>
            <h3 className="font-serif text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-2 sm:mb-3">
              {steps[step]?.question}
            </h3>
            {steps[step]?.subtitle && (
              <p className="text-muted-foreground text-sm mb-6 sm:mb-8">{steps[step].subtitle}</p>
            )}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {steps[step]?.options.map((opt) => {
                const isSelected = answers[steps[step].key] === opt.value;
                return (
                  <motion.button key={opt.value}
                    onClick={() => handleSelect(steps[step].key, opt.value)}
                    whileTap={{ scale: 0.95 }}
                    animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
                    className={`relative flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-8 rounded-xl border-2 transition-all duration-200 min-h-[100px] sm:min-h-0 active:bg-primary/10 hover:border-primary hover:bg-primary/10 ${isSelected ? "border-primary bg-primary/10" : "border-border"}`}>
                    {isSelected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute top-2 right-2 bg-primary rounded-full p-0.5">
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      </motion.div>
                    )}
                    <span className="text-xl sm:text-2xl">{opt.emoji}</span>
                    <span className="text-primary">{opt.icon}</span>
                    <span className="text-xs sm:text-sm font-medium text-foreground leading-tight">{opt.label}</span>
                    {opt.description && (
                      <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{opt.description}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-4 sm:hidden">← Desliza para navegar →</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default QuizSection;
