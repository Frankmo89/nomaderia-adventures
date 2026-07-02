import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, PanInfo } from "framer-motion";
import {
  Footprints, Map, Mountain, Shield, TreePine, Sun, Compass,
  ChevronLeft, ArrowRight, Sparkles, DollarSign, Wallet, TrendingUp,
  Mail, Loader2, Calendar, HeartPulse, Backpack, Tent,
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
import { buildWhatsAppLink } from "@/lib/whatsapp";
import Reveal from "@/components/editorial/Reveal";

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
  moderate: "bg-green/80 text-white",
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

// --- CompatibilityPill: count-up or friendly fallback ---
const CompatibilityPill = ({
  percent,
  size = "md",
}: {
  percent: number;
  size?: "md" | "sm";
}) => {
  const reduceMotion = useReducedMotion();
  const showPercent = percent >= 75;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!showPercent || reduceMotion) {
      setDisplayed(percent);
      return;
    }
    const duration = 1000;
    const startTime = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(eased * percent));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [percent, reduceMotion, showPercent]);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-secondary/10 text-secondary font-semibold",
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
      )}
    >
      {showPercent ? `${displayed}% compatible` : "Muy buena opción para ti"}
    </span>
  );
};

// --- QuizLoading component ---
const QuizLoading = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <Loader2 className="h-12 w-12 text-green" />
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
          className="w-2.5 h-2.5 rounded-full bg-green"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  </div>
);

// --- Celebration particles ---
const celebrationColors = ["bg-green", "bg-secondary", "bg-sky-500", "bg-yellow-400"];

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
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-stone/20 bg-sand/40 p-6 md:p-8">
        <p className="text-secondary font-medium">¡Listo! Revisa tu correo con tus resultados y empieza a planificar tu aventura.</p>
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
      className="rounded-2xl border border-stone/20 bg-sand/40 p-6 md:p-8"
    >
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-secondary shrink-0" strokeWidth={1.5} />
        <h4 className="font-serif text-xl font-semibold text-foreground leading-tight">
          Guarda tu aventura
        </h4>
      </div>
      <p className="text-sm text-stone-500 mt-1">
        Recibe tus resultados por correo y te ayudo a planificar tu próxima aventura.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <Input
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-4"
        />
        <Button type="submit" disabled={loading} className="w-full rounded-full bg-green hover:bg-green-dark text-white font-semibold py-3 mt-3 h-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar mis resultados →"}
        </Button>
      </form>
    </motion.div>
  );
};

// --- Sub-component: #1 hero result ---
const HeroResultCard = ({ d }: { d: QuizDestination }) => (
  <div>
    <p className="text-eyebrow text-secondary mb-3">Tu Destino Ideal</p>
    <h2 className="font-serif font-bold text-4xl md:text-5xl text-foreground leading-tight mb-5">
      {d.title}
    </h2>
    <div className="relative rounded-2xl overflow-hidden h-64 md:h-80 mb-5">
      {d.hero_image_url ? (
        <img
          src={d.hero_image_url}
          alt={`Vista de ${d.title}`}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover img-warm"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-green/10" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/80 via-transparent to-transparent" />
    </div>
    <div className="space-y-3">
      <CompatibilityPill percent={d.matchPercent} size="md" />
      {d.short_description && (
        <p className="text-base text-muted-foreground line-clamp-2">{d.short_description}</p>
      )}
      <Link
        to={`/destinos/${d.slug}`}
        className="inline-flex items-center gap-2 bg-green hover:bg-green-dark text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-lg shadow-green/30 transition-colors"
      >
        Ver Guía Completa <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </div>
);

// --- Sub-component: alternative result card ---
const AlternativeCard = ({ d }: { d: QuizDestination }) => (
  <Link
    to={`/destinos/${d.slug}`}
    className="block rounded-2xl overflow-hidden card-depth bg-card border border-border group"
  >
    <div className="relative h-40 overflow-hidden">
      {d.hero_image_url ? (
        <img
          src={d.hero_image_url}
          alt={`Vista de ${d.title}`}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover img-warm transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-green/10" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/50 via-transparent to-transparent" />
    </div>
    <div className="p-4 space-y-2">
      <h3 className="font-serif font-bold text-lg text-foreground leading-tight">{d.title}</h3>
      <CompatibilityPill percent={d.matchPercent} size="sm" />
      {d.short_description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{d.short_description}</p>
      )}
      <span className="text-sm font-medium text-green inline-flex items-center gap-1 pt-1">
        Ver Guía <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </div>
  </Link>
);

// --- Sub-component: Results view ---
const QuizResults = ({
  results,
  email,
  setEmail,
  loading,
  emailSubmitted,
  onEmailSubmit,
  isUsResident,
}: {
  results: QuizDestination[];
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  emailSubmitted: boolean;
  onEmailSubmit: () => void;
  isUsResident: boolean | null;
}) => {
  const reduceMotion = useReducedMotion();
  const topDestination = results[0];
  const alternatives = results.slice(1);
  const residentLine = isUsResident !== null
    ? `\nResidencia en EE. UU.: ${isUsResident ? "Sí" : "No"}`
    : "";
  const whatsAppUrl = topDestination
    ? buildWhatsAppLink(
        `Hola equipo de Nomaderia, acabo de hacer el Quiz, mi destino ideal es ${topDestination.title} y quiero que planifiquen mi itinerario personalizado. ¿Qué paquetes tienen?${residentLine}`,
      )
    : undefined;

  return (
    <section id="quiz" className="relative overflow-hidden bg-cloud py-16 sm:py-24">
      <CelebrationParticles />
      <div className="absolute inset-0 opacity-[0.04] bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=60)` }} />
      <div className="container mx-auto px-5 max-w-2xl relative z-10">

        {/* #1 hero result — fades in first */}
        {topDestination && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroResultCard d={topDestination} />
          </motion.div>
        )}

        {/* Alternatives — stagger 120ms after hero */}
        {alternatives.length > 0 && (
          <div className="mt-10 sm:mt-14">
            <p className="text-eyebrow text-stone-400 mb-5">También te puede gustar</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {alternatives.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reduceMotion ? { duration: 0 } : { delay: 0.12 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <AlternativeCard d={d} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp CTA — primary conversion action (logic untouched) */}
        {whatsAppUrl && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.5, duration: 0.5, ease: "easeOut" }}
            className="mt-10 sm:mt-12 flex justify-center"
          >
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-lg sm:text-xl px-8 py-5 rounded-2xl shadow-2xl shadow-green-700/40 transition-all duration-200 active:scale-[0.97] sm:hover:scale-[1.03] w-full max-w-md"
            >
              <WhatsAppIcon />
              Planifica mi itinerario 🗺️
            </a>
          </motion.div>
        )}

        {/* Email capture — always visible, discount offer (logic untouched) */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 0.7 }}
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

        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 0.9 }}
          className="mt-8 sm:mt-10 text-center"
        >
          <a href="#destinos" className="text-green hover:underline font-medium text-sm sm:text-base block">
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
    isQuizDone,
    handleSelect, handleBack, handleSwipe,
    fetchResults, handleEmailSubmit,
    handleCombinedSubmit,
  } = useQuiz(steps.length);

  const reduceMotion = useReducedMotion();
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [combinedSeason, setCombinedSeason] = useState("");
  const [isUsResident, setIsUsResident] = useState<boolean | null>(null);

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
    if (!combinedSeason || isUsResident === null) return;
    handleCombinedSubmit({ season: combinedSeason, is_us_resident: String(isUsResident) });
  };

  if (loading && !showResults) return (
    <section id="quiz" className="relative overflow-hidden bg-cloud py-16 sm:py-24">
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
      isUsResident={isUsResident}
    />
  );

  return (
    <section id="quiz" className="relative overflow-hidden bg-cloud py-16 sm:py-24">
      {/* Atmospheric glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/6 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full bg-accent/4 blur-3xl" />
      </div>

      <div className="container mx-auto px-5 max-w-2xl relative z-10">
        {/* Section header */}
        <Reveal className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 bg-green-wash border border-green/20 rounded-full px-4 py-1.5 text-sm text-green mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Cuestionario personalizado · 1 minuto
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
            ¿No Sabes A Dónde Ir?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Responde {steps.length} preguntas y te decimos tu destino ideal
          </p>
        </Reveal>


        {/* Glass card */}
        <div className="bg-card/50 backdrop-blur-md border border-border/70 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-background/60">
          {/* Linear progress bar — pinned to top of card */}
          <div className="h-[3px] rounded-full bg-stone/20 mb-5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-green"
              initial={false}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {/* Card top bar: back button + fraction */}
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
            <span aria-live="polite" aria-atomic="true" className="ml-auto text-xs text-stone-400">
              {Math.min(step + 1, steps.length)} / {steps.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -20 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
                    <label className="text-sm font-medium text-foreground">
                      ¿Eres ciudadano o residente de EE. UU.?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {([{ label: "Sí", value: true }, { label: "No", value: false }] as const).map(({ label, value }) => (
                        <button
                          key={String(value)}
                          type="button"
                          onClick={() => setIsUsResident(value)}
                          className={cn(
                            "h-11 rounded-xl border text-sm font-medium transition-colors duration-200",
                            isUsResident === value
                              ? "bg-green-wash border-green/50 text-foreground"
                              : cn("bg-white border-stone/20 text-foreground", canHover && "hover:border-stone/40")
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={onCombinedSubmit}
                    disabled={!combinedSeason || isUsResident === null}
                    className="w-full bg-green text-white shadow-lg shadow-green/20 h-11 mt-2"
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
                        whileTap={{ opacity: 0.9 }}
                        className={cn(
                          "w-full flex items-center gap-4 px-4 py-5 rounded-2xl border transition-colors duration-200 text-left",
                          isSelected
                            ? "bg-green-wash border-green/50"
                            : cn("bg-white border-stone/20", canHover && "hover:border-stone/40")
                        )}
                      >
                        {/* Icon tile */}
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors duration-200",
                          isSelected ? "bg-green-wash" : "bg-muted"
                        )}>
                          {opt.icon}
                        </div>

                        {/* Label + description */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-foreground leading-snug">
                            {opt.label}
                          </p>
                          {opt.description && (
                            <p className="text-sm text-stone-500 mt-0.5 leading-snug">
                              {opt.description}
                            </p>
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
