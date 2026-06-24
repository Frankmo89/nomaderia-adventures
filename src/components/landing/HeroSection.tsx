import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useFeaturedHeroPark, type HeroPark } from "@/hooks/use-destinations";

const KEN_BURNS_CSS = `
@keyframes hero-ken-burns {
  from { transform: scale(1.0) translateX(0px); }
  to   { transform: scale(1.06) translateX(-10px); }
}
`;

const ROTATE_INTERVAL_MS = 8000;

const SCRIM = {
  background:
    "linear-gradient(to bottom, transparent 38%, rgba(10,25,10,0.65) 70%, rgba(10,25,10,0.92) 100%)",
};

/** Extracts drive hours from strings like "3 horas en coche". Returns null for
 *  values containing "volar", without "horas en coche", or when hours > 8. */
function parseDriveHours(val: string | null): number | null {
  if (!val) return null;
  if (val.toLowerCase().includes("volar")) return null;
  if (!val.includes("horas en coche")) return null;
  const match = val.match(/^(\d+)/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  return hours <= 8 ? hours : null;
}

function stripParkPrefix(title: string): string {
  return title.replace(/^Parque Nacional\s+/i, "").trim();
}

function truncateWords(str: string, maxWords: number): string {
  const words = str.trim().split(/\s+/);
  return words.length <= maxWords ? str : words.slice(0, maxWords).join(" ");
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const CHIP =
  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white/90 bg-black/35 border border-white/20 backdrop-blur-sm";

/* ─── Loading skeleton ─── */
const HeroSkeleton = () => (
  <section className="relative min-h-[70vh] overflow-hidden bg-stone-900">
    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-stone-800 via-stone-700 to-stone-900" />
    <div className="absolute inset-0 pointer-events-none" style={SCRIM} />
    <div className="absolute bottom-0 left-0 px-4 pb-10 sm:px-6 sm:pb-14 md:px-10 md:pb-16 max-w-lg w-full space-y-3">
      <div className="h-3 w-28 rounded bg-white/10 animate-pulse" />
      <div className="h-10 w-56 rounded bg-white/15 animate-pulse" />
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-full bg-white/10 animate-pulse" />
        <div className="h-6 w-28 rounded-full bg-white/10 animate-pulse" />
        <div className="h-6 w-20 rounded-full bg-white/10 animate-pulse" />
      </div>
      <div className="h-11 w-44 rounded-full bg-white/15 animate-pulse" />
    </div>
  </section>
);

/* ─── Fallback (query error or empty result set) ─── */
const HeroFallback = () => (
  <section className="relative min-h-[70vh] overflow-hidden">
    <style>{KEN_BURNS_CSS}</style>
    <div
      className="absolute inset-0"
      style={{
        background: "linear-gradient(135deg, #166534 0%, #1C1917 55%, #78350F 100%)",
        animation: "hero-ken-burns 14s ease-in-out infinite alternate",
      }}
    />
    <div className="absolute inset-0 pointer-events-none" style={SCRIM} />
    <div className="absolute bottom-0 left-0 px-4 pb-10 sm:px-6 sm:pb-14 md:px-10 md:pb-16 max-w-xl">
      <span className="text-xs tracking-[0.2em] uppercase font-medium text-white/60 mb-2 block">
        Parque del momento
      </span>
      <h1 className="font-serif font-bold text-white text-3xl sm:text-4xl md:text-5xl leading-tight mb-6">
        Tu primera aventura empieza aquí
      </h1>
      <Button
        asChild
        className="rounded-full bg-primary text-primary-foreground h-auto px-7 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        <Link to="/destinos">Explorar destinos →</Link>
      </Button>
    </div>
  </section>
);

/* ─── Animated content block for the active park ─── */
const ParkContent = ({ park }: { park: HeroPark }) => {
  const displayTitle = stripParkPrefix(park.title);
  const driveHours = parseDriveHours(park.drive_time_from_san_diego);

  const difficultyChip =
    park.difficulty_level === "easy" ? "🟢 Fácil" : "🟡 Moderado";

  let distanceOrTypeChip: string | null = null;
  if (driveHours !== null) {
    distanceOrTypeChip = `📍 ${driveHours}h desde San Diego`;
  } else if (park.experience_type) {
    distanceOrTypeChip = `✨ ${truncateWords(park.experience_type, 4)}`;
  }

  const permitChip =
    park.requires_permit === true ? "🔒 Requiere permiso" : "🔓 Sin permiso";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="absolute bottom-0 left-0 px-4 pb-10 sm:px-6 sm:pb-14 md:px-10 md:pb-16 max-w-xl"
    >
      <span className="text-xs tracking-[0.2em] uppercase font-medium text-white/60 mb-2 block">
        Parque del momento
      </span>

      <h1 className="font-serif font-bold text-white text-3xl sm:text-4xl md:text-5xl leading-tight mb-4">
        {displayTitle}
      </h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <span className={CHIP}>{difficultyChip}</span>
        {distanceOrTypeChip !== null && (
          <span className={CHIP}>{distanceOrTypeChip}</span>
        )}
        <span className={CHIP}>{permitChip}</span>
      </div>

      <Button
        asChild
        className="rounded-full bg-primary text-primary-foreground h-auto px-7 py-3 text-sm font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
      >
        <Link to={`/destinos/${park.slug}`}>Ver guía completa →</Link>
      </Button>
    </motion.div>
  );
};

/* ─── Main component ─── */
const HeroSection = () => {
  const { data: rawParks = [], isLoading, isError } = useFeaturedHeroPark();

  // Shuffle once per unique park set; stable across re-renders with same data.
  const parkIds = rawParks.map((p) => p.id).sort().join(",");
  const parks = useMemo(
    () => (rawParks.length > 0 ? shuffle([...rawParks]) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parkIds]
  );

  const [activeIndex, setActiveIndex] = useState(0);

  // Reset to first slide when the park set changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [parkIds]);

  // Rotate slides every ROTATE_INTERVAL_MS.
  useEffect(() => {
    if (parks.length <= 1) return;
    const id = setInterval(
      () => setActiveIndex((prev) => (prev + 1) % parks.length),
      ROTATE_INTERVAL_MS
    );
    return () => clearInterval(id);
  }, [parks.length]);

  if (isLoading) return <HeroSkeleton />;
  if (isError || parks.length === 0) return <HeroFallback />;

  return (
    <section className="relative min-h-[70vh] overflow-hidden">
      <style>{KEN_BURNS_CSS}</style>

      {/* Background slides — stacked, crossfade via opacity */}
      {parks.map((park, i) => (
        <div
          key={park.id}
          aria-hidden={i !== activeIndex}
          className="absolute inset-0"
          style={{
            opacity: i === activeIndex ? 1 : 0,
            transition: "opacity 1.2s ease",
          }}
        >
          {park.hero_image_url && (
            <div
              className="absolute inset-0 bg-stone-900"
              style={{
                backgroundImage: `url(${park.hero_image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                animation: "hero-ken-burns 12s ease-in-out infinite alternate",
                animationDelay: `${i * -3}s`,
              }}
            />
          )}
        </div>
      ))}

      {/* Gradient scrim */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ ...SCRIM, zIndex: 1 }}
      />

      {/* Content — crossfades with AnimatePresence on activeIndex change */}
      <div className="relative" style={{ zIndex: 2 }}>
        <AnimatePresence mode="wait">
          <ParkContent key={activeIndex} park={parks[activeIndex]} />
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      {parks.length > 1 && (
        <div
          className="absolute right-5 flex items-center gap-2 sm:right-8"
          style={{ zIndex: 3, bottom: "clamp(40px, 14%, 80px)" }}
        >
          {parks.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Ir a parque ${i + 1}`}
              style={{
                height: 6,
                width: i === activeIndex ? 20 : 6,
                borderRadius: 3,
                background:
                  i === activeIndex ? "#FAFAFA" : "rgba(255,255,255,0.35)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroSection;
