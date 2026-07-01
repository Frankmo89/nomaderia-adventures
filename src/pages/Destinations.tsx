import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Lock,
  LockOpen,
  Route,
  Signal,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DistanceFromYou } from "@/components/destinations/DistanceFromYou";
import { OriginPicker } from "@/components/destinations/OriginPicker";
import { useCanonical, usePageMeta } from "@/hooks/use-seo";
import { useDestinationsDirectory, type ParkCard } from "@/hooks/use-destinations";
import { haversineKm, getDistanceBucket, SAN_DIEGO_ORIGIN } from "@/lib/distance";
import { formatRegionDisplay, getRegionCodes, STATE_NAMES } from "@/lib/regions";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCESS_LABELS: Record<string, string> = {
  facil: "En auto, fácil",
  planificacion: "Requiere planificación",
  aventureros: "Para aventureros",
  experto: "Solo expertos",
};

const ACCESS_VALUES = ["facil", "planificacion", "aventureros", "experto"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
// haversineKm / getDistanceBucket / SAN_DIEGO_ORIGIN viven en @/lib/distance
// (compartidos con el cálculo dinámico por ubicación del usuario).

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function getCellLabel(status: string | null): string {
  if (!status) return "Con señal";
  const s = status.toLowerCase();
  if (s.includes("nula") || s.includes("cero") || s.includes("sin señal")) return "Sin señal";
  if (
    s.includes("limitad") ||
    s.includes("intermitente") ||
    s.includes("débil") ||
    s.includes("debil") ||
    s.includes("mínima") ||
    s.includes("minima") ||
    s.includes("poca")
  )
    return "Señal limitada";
  return "Con señal";
}

// ─── ParkListCard ─────────────────────────────────────────────────────────────

// Dificultad: pill calmado green-wash para todos los niveles (Design System
// §4.1). Sin colores de semáforo (rojo/amarillo) ni emoji: no asustar a una
// audiencia principiante. Se diferencia por el texto del label.
const DIFFICULTY_BADGE: Record<string, { label: string; className: string }> = {
  easy: { label: "Fácil", className: "bg-green-wash text-green" },
  moderate: { label: "Moderado", className: "bg-green-wash text-green" },
  challenging: { label: "Desafiante", className: "bg-green-wash text-green" },
};

function ParkListCard({ park }: { park: ParkCard }) {
  const difficulty = DIFFICULTY_BADGE[park.difficulty_level] ?? DIFFICULTY_BADGE.moderate;
  const tagline = park.experience_type || park.short_description;

  return (
    <Link
      to={`/destinos/${park.slug}`}
      className="group block rounded-2xl overflow-hidden border border-stone bg-white shadow-[0_4px_16px_rgba(20,32,26,0.08)] hover:shadow-[0_8px_24px_rgba(20,32,26,0.12)] transition-shadow duration-200"
    >
      {/* Hero image */}
      <div className="relative h-28 overflow-hidden">
        {park.hero_image_url ? (
          <img
            src={park.hero_image_url}
            alt={park.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-green-wash flex items-center justify-center">
            <MapPin className="h-8 w-8 text-green/30" />
          </div>
        )}
        {/* Scrim con forest-dark (no negro puro) — Design System §4.3 */}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/55 via-forest-dark/10 to-transparent" />
        {/* Chip de guardar (decorativo, estilo AllTrails) */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm"
        >
          <Bookmark className="h-3.5 w-3.5 text-slate" />
        </div>
        {/* Difficulty badge — calmado green-wash */}
        <span
          className={cn(
            "absolute top-2 left-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
            difficulty.className
          )}
        >
          {difficulty.label}
        </span>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-ink leading-snug">
          {park.title}
        </h3>

        {tagline && (
          <p className="text-sm italic text-slate mt-1 line-clamp-2">{tagline}</p>
        )}

        {/* Access difficulty + cell signal — pills neutros calmados */}
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          {park.access_difficulty && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border border-stone bg-cloud text-slate">
              <Route className="h-3 w-3 shrink-0" />
              {ACCESS_LABELS[park.access_difficulty] ?? park.access_difficulty}
            </span>
          )}
          <span
            className="inline-flex items-center gap-1 text-xs text-sage"
            title={park.cell_signal_status ?? undefined}
          >
            <Signal className="h-3 w-3 shrink-0" />
            {getCellLabel(park.cell_signal_status)}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-sage">
          {park.region && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {formatRegionDisplay(park.region)}
            </span>
          )}
          <span className="flex items-center gap-1">
            {park.requires_permit ? (
              <>
                <Lock className="h-3 w-3 shrink-0" />
                Permiso requerido
              </>
            ) : (
              <>
                <LockOpen className="h-3 w-3 shrink-0" />
                Sin permiso
              </>
            )}
          </span>
        </div>

        {/* Distancia dinámica desde la ubicación del usuario (o fallback SD) */}
        <DistanceFromYou latitude={park.latitude} longitude={park.longitude} className="mt-2" />

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone">
          {park.estimated_budget_usd != null && (
            <span className="text-sm text-slate">
              ~${park.estimated_budget_usd} USD / persona
            </span>
          )}
          <span className="text-sm font-semibold text-green ml-auto group-hover:underline">
            Ver guía →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Types & config ───────────────────────────────────────────────────────────

type ActiveTab = "all" | "easy" | "moderate" | "challenging";
type DistanceFilter = "any" | "cerca" | "media" | "lejos";
type SortOrder = "distance" | "name";
type ParkWithDist = ParkCard & { distanceKm: number };

const TABS: Array<{ value: ActiveTab; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "easy", label: "Fácil" },
  { value: "moderate", label: "Moderado" },
  { value: "challenging", label: "Desafiante" },
];

const DISTANCE_OPTIONS: Array<{ value: DistanceFilter; label: string }> = [
  { value: "cerca", label: "Cerca (menos de 3h)" },
  { value: "media", label: "Media (3–8h)" },
  { value: "lejos", label: "Lejos (+8h o avión)" },
  { value: "any", label: "Cualquiera" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const Destinations = () => {
  useCanonical();
  usePageMeta({
    title: "Destinos — 63 Parques Nacionales | Nomaderia",
    description:
      "Directorio de los 63 parques nacionales de EE. UU. con guías en español para hispanos. Filtra por dificultad, estado y distancia desde San Diego.",
  });

  const { data: allParks = [], isLoading, error } = useDestinationsDirectory();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [filterAccess, setFilterAccess] = useState<Set<string>>(new Set());
  const [filterStates, setFilterStates] = useState<Set<string>>(new Set());
  const [filterDistance, setFilterDistance] = useState<DistanceFilter>("any");
  const [filterNoPermit, setFilterNoPermit] = useState(false);
  const [filterCamping, setFilterCamping] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("distance");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showStates, setShowStates] = useState(false);

  // Precompute haversine distance for each park
  const parksWithDist = useMemo<ParkWithDist[]>(
    () =>
      allParks.map((p) => ({
        ...p,
        distanceKm:
          p.latitude != null && p.longitude != null
            ? haversineKm(SAN_DIEGO_ORIGIN.lat, SAN_DIEGO_ORIGIN.lng, p.latitude, p.longitude)
            : Infinity,
      })),
    [allParks]
  );

  // All unique state codes sorted by Spanish name (for the state filter)
  const allStateCodes = useMemo(() => {
    const set = new Set<string>();
    allParks.forEach((p) => getRegionCodes(p.region).forEach((c) => set.add(c)));
    return Array.from(set).sort((a, b) =>
      (STATE_NAMES[a] ?? a).localeCompare(STATE_NAMES[b] ?? b, "es")
    );
  }, [allParks]);

  // Combined filter + sort — all client-side, no extra DB calls
  const filteredParks = useMemo(() => {
    const q = normalize(search);
    return parksWithDist
      .filter((p) => {
        // Accent-insensitive search on title
        if (q && !normalize(p.title).includes(q)) return false;
        // Difficulty tab
        if (activeTab === "easy" && p.difficulty_level !== "easy") return false;
        if (activeTab === "moderate" && p.difficulty_level !== "moderate") return false;
        if (activeTab === "challenging" && p.difficulty_level !== "challenging") return false;
        // Access difficulty (OR within multi-select)
        if (filterAccess.size > 0 && !filterAccess.has(p.access_difficulty ?? "")) return false;
        // State (OR within multi-select — park matches if any of its codes is selected)
        if (filterStates.size > 0) {
          const codes = getRegionCodes(p.region);
          if (!codes.some((c) => filterStates.has(c))) return false;
        }
        // Distance bucket
        if (filterDistance !== "any") {
          if (!isFinite(p.distanceKm)) return false;
          if (getDistanceBucket(p.distanceKm) !== filterDistance) return false;
        }
        // No-permit toggle
        if (filterNoPermit && p.requires_permit !== false) return false;
        // Camping toggle
        if (filterCamping && p.camping_available !== true) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "name") return a.title.localeCompare(b.title, "es");
        // Ascending distance; parks without coords go last
        if (!isFinite(a.distanceKm) && !isFinite(b.distanceKm)) return 0;
        if (!isFinite(a.distanceKm)) return 1;
        if (!isFinite(b.distanceKm)) return -1;
        return a.distanceKm - b.distanceKm;
      });
  }, [parksWithDist, search, activeTab, filterAccess, filterStates, filterDistance, filterNoPermit, filterCamping, sortOrder]);

  function clearAllFilters() {
    setSearch("");
    setActiveTab("all");
    setFilterAccess(new Set());
    setFilterStates(new Set());
    setFilterDistance("any");
    setFilterNoPermit(false);
    setFilterCamping(false);
  }

  function toggleAccess(val: string) {
    setFilterAccess((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });
  }

  function toggleState(code: string) {
    setFilterStates((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  return (
    <main className="bg-background min-h-screen">
      <Navbar />

      {/* Page header */}
      <section className="pt-28 pb-4 sm:pt-32">
        <div className="container mx-auto px-5 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground"
          >
            Destinos
          </motion.h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            63 parques nacionales · guías en español
          </p>
        </div>
      </section>

      {/* Sticky container: search bar + difficulty tabs */}
      <div className="sticky top-16 z-30 bg-background shadow-[0_1px_0_0_rgb(0_0_0/0.06)]">
        {/* Search + Filtros button */}
        <div className="container mx-auto px-5 py-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Buscar parque..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-1.5 shrink-0"
            onClick={() => setSheetOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">Filtros</span>
          </Button>
        </div>

        {/* Difficulty tabs + quick-filter chips — scrollable horizontally */}
        <div className="flex overflow-x-auto border-t border-stone-100 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex-none px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2",
                activeTab === tab.value
                  ? "border-green text-[#1C1917]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}

          {/* Separator */}
          <span className="self-center mx-1 h-4 w-px bg-stone-200 flex-none" aria-hidden />

          {/* 🔓 Sin permiso */}
          <button
            onClick={() => setFilterNoPermit((prev) => !prev)}
            className={cn(
              "flex-none self-center mx-1 px-3 py-1.5 text-sm font-medium whitespace-nowrap rounded-full border transition-colors",
              filterNoPermit
                ? "bg-[#166534] text-white border-[#166534]"
                : "border-stone-200 text-muted-foreground hover:text-foreground bg-background"
            )}
          >
            🔓 Sin permiso
          </button>

          {/* 🏕️ Acampar */}
          <button
            onClick={() => setFilterCamping((prev) => !prev)}
            className={cn(
              "flex-none self-center mx-1 px-3 py-1.5 text-sm font-medium whitespace-nowrap rounded-full border transition-colors",
              filterCamping
                ? "bg-[#166534] text-white border-[#166534]"
                : "border-stone-200 text-muted-foreground hover:text-foreground bg-background"
            )}
          >
            🏕️ Acampar
          </button>

          {/* Más ▾ — opens the full filter sheet */}
          <button
            onClick={() => setSheetOpen(true)}
            className="flex-none self-center mx-1 mr-3 px-3 py-1.5 text-sm font-medium whitespace-nowrap rounded-full border border-stone-200 text-muted-foreground hover:text-foreground bg-background transition-colors"
          >
            Más ▾
          </button>
        </div>
      </div>

      {/* Origin control — distancias dinámicas desde la ubicación del usuario */}
      <div className="container mx-auto px-5 pt-3">
        <OriginPicker className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" />
      </div>

      {/* Count + sort bar */}
      <div className="container mx-auto px-5 py-3 flex items-center justify-between border-b border-stone-100">
        <span className="text-sm text-muted-foreground">
          {isLoading ? "Cargando…" : `Mostrando ${filteredParks.length} parques`}
        </span>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs text-muted-foreground sr-only sm:not-sr-only">
            Ordenar:
          </label>
          <select
            id="sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="text-xs sm:text-sm border border-stone-200 rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
          >
            <option value="distance">Más cercanos a San Diego</option>
            <option value="name">Nombre (A–Z)</option>
          </select>
        </div>
      </div>

      {/* Cards list */}
      <div className="container mx-auto px-5 py-5 space-y-4 pb-24">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-stone-100 bg-card">
                <div className="skeleton-shimmer h-28 w-full" />
                <div className="p-4 space-y-2.5">
                  <div className="skeleton-shimmer h-5 w-3/4 rounded-md" />
                  <div className="skeleton-shimmer h-4 w-full rounded-md" />
                  <div className="skeleton-shimmer h-4 w-2/3 rounded-md" />
                  <div className="skeleton-shimmer h-4 w-1/2 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-center text-muted-foreground py-12">
            No se pudieron cargar los destinos. Intenta recargar la página.
          </p>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredParks.length === 0 && (
          <div className="text-center py-16 px-4">
            <p className="text-muted-foreground text-base mb-4">
              No encontramos ese parque. ¿Buscabas algo fácil cerca de ti?
            </p>
            <Button variant="outline" onClick={clearAllFilters}>
              Limpiar filtros
            </Button>
          </div>
        )}

        {/* Park cards */}
        {!isLoading &&
          !error &&
          filteredParks.map((park) => <ParkListCard key={park.id} park={park} />)}
      </div>

      {/* Bottom sheet — Más filtros */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          style={{ height: 'auto', maxHeight: '50vh' }}
          className="flex flex-col gap-0 p-0 rounded-t-2xl overflow-hidden"
        >
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-stone-100 flex-shrink-0">
            <SheetTitle className="font-serif text-lg text-left">Más filtros</SheetTitle>
          </SheetHeader>

          {/* Scrollable filter content */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
            {/* Cómo llegar */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">Cómo llegar</h3>
              <div className="space-y-3">
                {ACCESS_VALUES.map((val) => (
                  <div key={val} className="flex items-center gap-3">
                    <Checkbox
                      id={`access-${val}`}
                      checked={filterAccess.has(val)}
                      onCheckedChange={() => toggleAccess(val)}
                    />
                    <label htmlFor={`access-${val}`} className="text-sm cursor-pointer">
                      {ACCESS_LABELS[val]}
                    </label>
                  </div>
                ))}
              </div>
            </section>

            {/* Estado */}
            <section>
              <button
                type="button"
                onClick={() => setShowStates((prev) => !prev)}
                className="w-full flex items-center justify-between text-sm font-semibold text-foreground py-1"
              >
                <span>
                  Ver por estado{filterStates.size > 0 ? ` (${filterStates.size})` : ""}{" "}
                  {showStates ? "▲" : "▾"}
                </span>
              </button>
              {showStates && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-3 overflow-y-auto">
                  {allStateCodes.map((code) => (
                    <div key={code} className="flex items-center gap-2">
                      <Checkbox
                        id={`state-${code}`}
                        checked={filterStates.has(code)}
                        onCheckedChange={() => toggleState(code)}
                      />
                      <label
                        htmlFor={`state-${code}`}
                        className="text-sm cursor-pointer leading-tight"
                      >
                        {STATE_NAMES[code] ?? code}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Distancia desde San Diego */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Distancia desde San Diego
              </h3>
              <div className="space-y-3">
                {DISTANCE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="distance-filter"
                      value={opt.value}
                      checked={filterDistance === opt.value}
                      onChange={() => setFilterDistance(opt.value)}
                      className="h-4 w-4 cursor-pointer accent-[#D97706]"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Sheet footer — sticky inside */}
          <div className="flex-shrink-0 border-t border-stone-100 px-5 py-4 flex items-center justify-between bg-background">
            <button
              onClick={clearAllFilters}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Limpiar filtros
            </button>
            <Button
              onClick={() => setSheetOpen(false)}
              className="bg-green text-white hover:bg-green-dark px-5"
            >
              Ver {filteredParks.length} parques
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Footer />
    </main>
  );
};

export default Destinations;
