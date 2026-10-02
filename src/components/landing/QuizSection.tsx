import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, PanInfo } from "framer-motion";
import {
  Footprints, Map, Mountain, Shield, TreePine, Sun, Compass,
  ChevronLeft, ArrowRight, Sparkles, DollarSign, Wallet, TrendingUp,
  Mail, Loader2, HeartPulse, Backpack, Tent, MapPin,
  Users, BedDouble, Baby, UserRound, Hotel, Home, Car, Plane, HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useQuiz } from "@/hooks/use-quiz";
import type { QuizDestination, QuizPreview, QuizStep } from "@/hooks/use-quiz";
import { cn } from "@/lib/utils";
import { isIslandZip, isValidZipFormat, lookupZip, preloadZipTable } from "@/lib/zip-centroids";
import {
  DRIVE_HOUR_OPTIONS,
  MONTH_UNKNOWN,
  originAnswerFields,
  type TravelMode,
} from "@/lib/quiz-ranking";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import Reveal from "@/components/editorial/Reveal";
import { resizedImageUrl } from "@/lib/resized-image";

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

const MONTH_OPTIONS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
].map((label, i) => ({ label, value: String(i + 1) }));

const iconCls = "h-6 w-6 sm:h-7 sm:w-7";

const TRAVEL_MODE_OPTIONS: { value: TravelMode; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "drive", label: "Manejando", description: "Road trip desde tu casa", icon: <Car className={iconCls} /> },
  { value: "fly", label: "Volando", description: "Tomo un vuelo y rento auto", icon: <Plane className={iconCls} /> },
  { value: "unsure", label: "Todavía no sé", description: "Te mostramos de todo", icon: <HelpCircle className={iconCls} /> },
];

// 10 screens. ZIP + travel mode share one screen (with the 3/6/10 h chips shown
// only for "Manejando") so the quiz stays at 10 — don't split them into two steps.
const steps: QuizStep[] = [
  {
    question: "¿Desde dónde sales?",
    subtitle: "Así calculamos distancias y tiempos de manejo",
    key: "origin",
    type: "origin",
  },
  {
    question: "¿En qué mes piensas ir?",
    subtitle: "Así evitamos parques fuera de temporada. Las fechas exactas las vemos después.",
    key: "month",
    type: "month",
  },
  {
    question: "¿Con quién viajas?",
    subtitle: "Marca todo lo que aplique (puedes dejar vacío si van solo adultos)",
    key: "group",
    type: "group",
  },
  {
    question: "¿Cuál es tu nivel de actividad física?",
    subtitle: "Esto nos ayuda a encontrar rutas adecuadas para ti",
    key: "fitness_level",
    options: [
      { label: "Camino poco", value: "sedentary", icon: <Footprints className={iconCls} />, description: "Paseos cortos y tranquilos" },
      { label: "Camino seguido", value: "light_activity", icon: <Map className={iconCls} />, description: "Caminatas de unas horas" },
      { label: "Hago ejercicio regular", value: "moderate", icon: <Mountain className={iconCls} />, description: "Entreno varias veces por semana" },
      { label: "Soy bastante activo", value: "active", icon: <Shield className={iconCls} />, description: "Listo para cualquier desafío" },
    ],
  },
  {
    question: "¿Qué paisaje te emociona más?",
    subtitle: "Cada paisaje ofrece una experiencia única",
    key: "interest",
    options: [
      { label: "Montañas", value: "mountains", icon: <Mountain className={iconCls} />, description: "Cumbres, valles y aire fresco" },
      { label: "Bosques", value: "forests", icon: <TreePine className={iconCls} />, description: "Senderos entre la naturaleza" },
      { label: "Desiertos", value: "deserts", icon: <Sun className={iconCls} />, description: "Paisajes áridos y majestuosos" },
      { label: "Caminos Culturales", value: "cultural", icon: <Compass className={iconCls} />, description: "Historia y tradiciones vivas" },
    ],
  },
  {
    question: "¿Cuántos días tienes?",
    subtitle: "Hay aventuras para cada agenda",
    key: "trip_duration",
    options: [
      { label: "Un fin de semana", value: "weekend", icon: <Sun className={iconCls} />, description: "2-3 días de aventura" },
      { label: "Una semana", value: "one_week", icon: <Compass className={iconCls} />, description: "5-7 días para explorar" },
      { label: "Dos semanas o más", value: "two_weeks", icon: <Map className={iconCls} />, description: "Viaje largo e inmersivo" },
    ],
  },
  {
    question: "¿Dónde prefieres dormir?",
    subtitle: "Hotel, camping o una mezcla — tú decides",
    key: "lodging",
    options: [
      { label: "Hotel o motel", value: "hotel", icon: <Hotel className={iconCls} />, description: "Cama y baño privados" },
      { label: "Cabaña / lodge", value: "cabin", icon: <Home className={iconCls} />, description: "Más cerca de la naturaleza" },
      { label: "Camping", value: "camping", icon: <Tent className={iconCls} />, description: "Carpa o vehículo" },
      { label: "Mezcla / aún no sé", value: "mixed", icon: <BedDouble className={iconCls} />, description: "Flexible según el parque" },
    ],
  },
  {
    question: "¿Qué es lo que más te frena para salir a explorar?",
    subtitle: "Nomaderia está diseñado para ayudarte con esto",
    key: "main_barrier",
    options: [
      { label: "No saber por dónde empezar", value: "lack_info", icon: <Map className={iconCls} />, description: "Miedo a perderme o elegir mal" },
      { label: "Siento que me falta condición", value: "fitness_doubt", icon: <HeartPulse className={iconCls} />, description: "Temor a no aguantar el ritmo" },
      { label: "No tengo el equipo adecuado", value: "no_gear", icon: <Backpack className={iconCls} />, description: "No quiero gastar en ropa técnica" },
      { label: "Me preocupa la incomodidad", value: "comfort", icon: <Tent className={iconCls} />, description: "Temas de baño, clima o dormir mal" },
    ],
  },
  {
    question: "¿Cuál es tu presupuesto?",
    subtitle: "Encuentra destinos que se ajusten a tu bolsillo",
    key: "budget_range",
    options: [
      { label: "Económico", value: "low", icon: <Wallet className={iconCls} />, description: "Menos de $500 USD" },
      { label: "Moderado", value: "medium", icon: <DollarSign className={iconCls} />, description: "$500 - $1,500 USD" },
      { label: "Premium", value: "high", icon: <TrendingUp className={iconCls} />, description: "$1,500 - $3,000 USD" },
      { label: "Sin límite", value: "unlimited", icon: <Sparkles className={iconCls} />, description: "La aventura no tiene precio" },
    ],
  },
  {
    question: "Último detalle",
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

// --- Free AI preview panel (T05) ---
const PreviewPanel = ({
  preview,
  loading,
  parkTitle,
}: {
  preview: QuizPreview | null;
  loading: boolean;
  parkTitle: string;
}) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-stone/20 bg-white/80 p-5 sm:p-6 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-green shrink-0" />
        <p className="text-sm text-muted-foreground">
          Generando preview gratuito de {parkTitle}…
        </p>
      </div>
    );
  }
  if (!preview) return null;

  return (
    <div className="rounded-2xl border border-green/20 bg-green-wash/40 p-5 sm:p-6 space-y-4">
      <div>
        <p className="text-eyebrow text-green mb-1">Preview gratis</p>
        <h3 className="font-serif text-xl font-semibold text-foreground">
          Día 1 en {preview.park_title}
        </h3>
      </div>
      <p className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-line">
        {preview.day1_plan}
      </p>
      <div className="space-y-2 text-sm border-t border-stone/15 pt-4">
        <p className="text-foreground">
          <span className="font-medium text-ink">Entrada: </span>
          {preview.entry_cost}
        </p>
        <p className={cn("text-foreground", !preview.alerts_available && "text-stone-500")}>
          <span className="font-medium text-ink">Alertas: </span>
          {preview.alerts_summary}
        </p>
        {preview.synced_at && (
          <p className="text-xs text-stone-400">
            Datos NPS sincronizados: {new Date(preview.synced_at).toLocaleDateString("es-US")}
          </p>
        )}
      </div>
    </div>
  );
};

// --- Sub-component: #1 hero result ---
const HeroResultCard = ({
  d,
  selected,
  onSelect,
}: {
  d: QuizDestination;
  selected: boolean;
  onSelect: () => void;
}) => (
  <div>
    <p className="text-eyebrow text-secondary mb-3">Tu Destino Ideal</p>
    <h2 className="font-serif font-bold text-4xl md:text-5xl text-foreground leading-tight mb-5">
      {d.title}
    </h2>
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-full rounded-2xl overflow-hidden h-64 md:h-80 mb-5 text-left ring-offset-cloud transition-shadow",
        selected ? "ring-2 ring-green ring-offset-2" : "ring-0",
      )}
    >
      {d.hero_image_url ? (
        <img
          src={resizedImageUrl(d.hero_image_url, 720)}
          alt={`Vista de ${d.title}`}
          loading="lazy"
          decoding="async"
          width={720}
          height={400}
          className="w-full h-full object-cover img-warm"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-green/10" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/80 via-transparent to-transparent" />
      {selected && (
        <span className="absolute top-3 right-3 bg-green text-white text-xs font-semibold px-3 py-1 rounded-md">
          Seleccionado
        </span>
      )}
    </button>
    <div className="space-y-3">
      <CompatibilityPill percent={d.matchPercent} size="md" />
      {d.matchReasons.length > 0 && (
        <p className="text-sm text-stone-500">{d.matchReasons.join(" · ")}</p>
      )}
      {d.short_description && (
        <p className="text-base text-muted-foreground line-clamp-2">{d.short_description}</p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors",
            selected
              ? "bg-green text-white"
              : "bg-white border border-stone/30 text-foreground hover:border-green/40",
          )}
        >
          {selected ? "Parque elegido" : "Elegir este parque"}
        </button>
        <Link
          to={`/destinos/${d.slug}`}
          className="inline-flex items-center gap-2 bg-green hover:bg-green-dark text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-lg shadow-green/30 transition-colors"
        >
          Ver Guía Completa <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  </div>
);

// --- Sub-component: alternative result card ---
const AlternativeCard = ({
  d,
  selected,
  onSelect,
}: {
  d: QuizDestination;
  selected: boolean;
  onSelect: () => void;
}) => (
  <div
    className={cn(
      "rounded-2xl overflow-hidden card-depth bg-card border group",
      selected ? "border-green ring-1 ring-green/40" : "border-border",
    )}
  >
    <button type="button" onClick={onSelect} className="block w-full text-left">
      <div className="relative h-40 overflow-hidden">
        {d.hero_image_url ? (
          <img
            src={resizedImageUrl(d.hero_image_url, 640)}
            alt={`Vista de ${d.title}`}
            loading="lazy"
            decoding="async"
            width={640}
            height={320}
            className="w-full h-full object-cover img-warm transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-green/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/50 via-transparent to-transparent" />
        {selected && (
          <span className="absolute top-2 right-2 bg-green text-white text-[10px] font-semibold px-2 py-0.5 rounded">
            Elegido
          </span>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-serif font-bold text-lg text-foreground leading-tight">{d.title}</h3>
        <CompatibilityPill percent={d.matchPercent} size="sm" />
        {d.matchReasons.length > 0 && (
          <p className="text-xs text-stone-500 line-clamp-2">{d.matchReasons.join(" · ")}</p>
        )}
        {d.short_description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{d.short_description}</p>
        )}
      </div>
    </button>
    <div className="px-4 pb-4">
      <Link
        to={`/destinos/${d.slug}`}
        className="text-sm font-medium text-green inline-flex items-center gap-1"
      >
        Ver Guía <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  </div>
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
  selectedDestinationId,
  onSelectPark,
  preview,
  previewLoading,
}: {
  results: QuizDestination[];
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  emailSubmitted: boolean;
  onEmailSubmit: () => void;
  isUsResident: boolean | null;
  selectedDestinationId: string | null;
  onSelectPark: (id: string) => void;
  preview: QuizPreview | null;
  previewLoading: boolean;
}) => {
  const reduceMotion = useReducedMotion();
  const topDestination = results[0];
  const alternatives = results.slice(1);
  const selected =
    results.find((d) => d.id === selectedDestinationId) ?? topDestination;
  const residentLine = isUsResident !== null
    ? `\nResidencia en EE. UU.: ${isUsResident ? "Sí" : "No"}`
    : "";
  const whatsAppUrl = selected
    ? buildWhatsAppLink(
        `Hola equipo de Nomaderia, acabo de hacer el Quiz, mi destino ideal es ${selected.title} y quiero que planifiquen mi itinerario personalizado. ¿Qué paquetes tienen?${residentLine}`,
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
            <HeroResultCard
              d={topDestination}
              selected={selectedDestinationId === topDestination.id}
              onSelect={() => onSelectPark(topDestination.id)}
            />
          </motion.div>
        )}

        {/* Free AI preview for selected park */}
        {selected && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.25, duration: 0.45 }}
            className="mt-8"
          >
            <PreviewPanel
              preview={preview}
              loading={previewLoading}
              parkTitle={selected.title}
            />
          </motion.div>
        )}

        {/* Alternatives — stagger 120ms after hero */}
        {alternatives.length > 0 && (
          <div className="mt-10 sm:mt-14">
            <p className="text-eyebrow text-stone-400 mb-5">También te puede gustar — elige uno</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {alternatives.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reduceMotion ? { duration: 0 } : { delay: 0.12 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <AlternativeCard
                    d={d}
                    selected={selectedDestinationId === d.id}
                    onSelect={() => onSelectPark(d.id)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp CTA — primary conversion action */}
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
              className="inline-flex items-center justify-center gap-3 bg-green hover:bg-green-dark active:bg-green-dark text-white font-bold text-lg sm:text-xl px-8 py-5 rounded-2xl shadow-2xl shadow-green/40 transition-all duration-200 active:scale-[0.97] sm:hover:scale-[1.03] w-full max-w-md"
            >
              <WhatsAppIcon />
              Planifica mi itinerario 🗺️
            </a>
          </motion.div>
        )}

        {/* Email capture → creates Phase 1 lead (client UUID) */}
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
    selectedDestinationId, selectPark,
    preview, previewLoading,
    handleSelect, handleBack, handleSwipe,
    fetchResults, handleEmailSubmit,
    handleCombinedSubmit, handleFieldsSubmit,
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
  const [isUsResident, setIsUsResident] = useState<boolean | null>(null);
  const [zip, setZip] = useState("");
  const [zipError, setZipError] = useState<string | null>(null);
  const [zipChecking, setZipChecking] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode | null>(null);
  const [driveHours, setDriveHours] = useState<(typeof DRIVE_HOUR_OPTIONS)[number] | null>(null);
  const [groupKids, setGroupKids] = useState(false);
  const [groupOlderAdults, setGroupOlderAdults] = useState(false);
  const [groupVisitorsAbroad, setGroupVisitorsAbroad] = useState(false);

  useEffect(() => {
    if (isQuizDone && !showResults && !loading) {
      fetchResults();
    }
  }, [isQuizDone, showResults, loading, fetchResults]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    handleSwipe(info.offset.x, step, answers, steps[step]?.key ?? "");
  };

  const currentStep = steps[Math.min(step, steps.length - 1)];
  const stepType = currentStep?.type ?? "options";
  const isCustomStep = stepType !== "options";

  const dragProps = isCustomStep ? {} : {
    drag: "x" as const,
    dragConstraints: { left: 0, right: 0 },
    dragElastic: 0.15,
    onDragEnd,
  };

  const onCombinedSubmit = () => {
    if (isUsResident === null) return;
    handleCombinedSubmit({ is_us_resident: String(isUsResident) });
  };

  const originReady =
    isValidZipFormat(zip) && travelMode !== null && (travelMode !== "drive" || driveHours !== null);

  const onOriginSubmit = async () => {
    if (!originReady || zipChecking) return;
    setZipChecking(true);
    setZipError(null);
    try {
      const centroid = await lookupZip(zip);
      if (!centroid) {
        setZipError("No encontramos ese código postal. Revisa que sean los 5 dígitos de tu código en EE. UU.");
        return;
      }
      const { answers: fields, logFields } = originAnswerFields({
        zip,
        centroid,
        travelMode: travelMode!,
        maxDriveHours: travelMode === "drive" ? driveHours ?? undefined : undefined,
      });
      handleFieldsSubmit(fields, logFields);
    } catch {
      setZipError("No pudimos validar tu código postal. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setZipChecking(false);
    }
  };

  const onGroupSubmit = () => {
    handleFieldsSubmit({
      group_kids: String(groupKids),
      group_older_adults: String(groupOlderAdults),
      group_visitors_abroad: String(groupVisitorsAbroad),
    });
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
      selectedDestinationId={selectedDestinationId}
      onSelectPark={selectPark}
      preview={preview}
      previewLoading={previewLoading}
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
            Cuestionario personalizado · unos minutos
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

              {stepType === "origin" ? (
                <form
                  className="space-y-6 mt-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void onOriginSubmit();
                  }}
                >
                  <div className="space-y-2">
                    <label htmlFor="quiz-zip" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      ¿Cuál es tu código postal?
                    </label>
                    <Input
                      id="quiz-zip"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={5}
                      placeholder="Ej. 92101"
                      value={zip}
                      onFocus={preloadZipTable}
                      onChange={(e) => {
                        setZip(e.target.value.replace(/\D/g, "").slice(0, 5));
                        setZipError(null);
                      }}
                      aria-invalid={zipError !== null}
                      aria-describedby={zipError ? "quiz-zip-error" : undefined}
                      className="bg-muted border-border text-foreground h-11 text-base tracking-widest max-w-[10rem]"
                    />
                    <p id="quiz-zip-error" aria-live="polite" className="text-sm text-destructive min-h-[1.25rem]">
                      {zipError}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">¿Cómo piensas llegar?</p>
                    {TRAVEL_MODE_OPTIONS.map((opt) => {
                      const selected = travelMode === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            setTravelMode(opt.value);
                            if (opt.value !== "drive") setDriveHours(null);
                          }}
                          className={cn(
                            "w-full flex items-center gap-4 px-4 py-4 rounded-2xl border transition-colors duration-200 text-left",
                            selected
                              ? "bg-green-wash border-green/50"
                              : cn("bg-white border-stone/20", canHover && "hover:border-stone/40"),
                          )}
                        >
                          <div className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                            selected ? "bg-green-wash" : "bg-muted",
                          )}>
                            {opt.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-medium text-foreground leading-snug">{opt.label}</p>
                            <p className="text-sm text-stone-500 mt-0.5 leading-snug">{opt.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {travelMode === "drive" && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">¿Cuántas horas máximo manejarías?</p>
                      <div className="grid grid-cols-3 gap-3">
                        {DRIVE_HOUR_OPTIONS.map((h) => (
                          <button
                            key={h}
                            type="button"
                            aria-pressed={driveHours === h}
                            onClick={() => setDriveHours(h)}
                            className={cn(
                              "h-11 rounded-xl border text-sm font-medium transition-colors duration-200",
                              driveHours === h
                                ? "bg-green-wash border-green/50 text-foreground"
                                : cn("bg-white border-stone/20 text-foreground", canHover && "hover:border-stone/40"),
                            )}
                          >
                            {h} h
                          </button>
                        ))}
                      </div>
                      {isIslandZip(zip) && (
                        <p className="text-xs text-stone-500">
                          Desde islas no aplicamos límite de manejo — te mostramos parques a los que puedes volar.
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={!originReady || zipChecking}
                    className="w-full bg-green text-white shadow-lg shadow-green/20 h-11"
                  >
                    {zipChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continuar <ArrowRight className="h-4 w-4 ml-2" /></>}
                  </Button>
                </form>
              ) : stepType === "month" ? (
                <div className="mt-5 space-y-3">
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {MONTH_OPTIONS.map((m) => {
                      const selected = answers.month === m.value;
                      return (
                        <button
                          key={m.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => handleSelect("month", m.value)}
                          className={cn(
                            "h-12 rounded-xl border text-sm font-medium transition-colors duration-200",
                            selected
                              ? "bg-green-wash border-green/50 text-foreground"
                              : cn("bg-white border-stone/20 text-foreground", canHover && "hover:border-stone/40"),
                          )}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    aria-pressed={answers.month === MONTH_UNKNOWN}
                    onClick={() => handleSelect("month", MONTH_UNKNOWN)}
                    className={cn(
                      "w-full h-12 rounded-xl border text-sm font-medium transition-colors duration-200",
                      answers.month === MONTH_UNKNOWN
                        ? "bg-green-wash border-green/50 text-foreground"
                        : cn("bg-white border-stone/20 text-foreground", canHover && "hover:border-stone/40"),
                    )}
                  >
                    Aún no sé
                  </button>
                </div>
              ) : stepType === "group" ? (
                <div className="space-y-3 mt-5">
                  {(
                    [
                      { key: "kids", label: "Viajamos con niños", description: "Menores en el grupo", icon: <Baby className={iconCls} />, checked: groupKids, set: setGroupKids },
                      { key: "older", label: "Hay adultos mayores", description: "Ritmo más calmado", icon: <UserRound className={iconCls} />, checked: groupOlderAdults, set: setGroupOlderAdults },
                      { key: "abroad", label: "Familiares desde fuera de EE. UU.", description: "Visitan desde otro país", icon: <Users className={iconCls} />, checked: groupVisitorsAbroad, set: setGroupVisitorsAbroad },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => opt.set(!opt.checked)}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-5 rounded-2xl border transition-colors duration-200 text-left",
                        opt.checked
                          ? "bg-green-wash border-green/50"
                          : cn("bg-white border-stone/20", canHover && "hover:border-stone/40")
                      )}
                    >
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                        opt.checked ? "bg-green-wash" : "bg-muted"
                      )}>
                        {opt.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-foreground leading-snug">{opt.label}</p>
                        <p className="text-sm text-stone-500 mt-0.5 leading-snug">{opt.description}</p>
                      </div>
                    </button>
                  ))}
                  <Button
                    onClick={onGroupSubmit}
                    className="w-full bg-green text-white shadow-lg shadow-green/20 h-11 mt-2"
                  >
                    Continuar <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ) : stepType === "combined" ? (
                <div className="space-y-5 mt-5">
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
                    disabled={isUsResident === null}
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
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors duration-200",
                          isSelected ? "bg-green-wash" : "bg-muted"
                        )}>
                          {opt.icon}
                        </div>
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

              {!isCustomStep && (
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
