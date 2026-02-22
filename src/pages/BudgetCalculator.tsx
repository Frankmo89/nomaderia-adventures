import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Plane, Hotel, UtensilsCrossed, Compass, Backpack, ShieldCheck, ArrowRight, Mail } from "lucide-react";

interface Destination {
  id: string;
  title: string;
  slug: string;
  country: string;
  estimated_budget_usd: number | null;
  days_needed: string | null;
  difficulty_level: string;
  affiliate_links: Record<string, string> | null;
}

type ComfortLevel = "budget" | "mid" | "premium";

const comfortOptions: { value: ComfortLevel; label: string; emoji: string }[] = [
  { value: "budget", label: "Mochilero", emoji: "🎒" },
  { value: "mid", label: "Cómodo", emoji: "🏨" },
  { value: "premium", label: "Premium", emoji: "✨" },
];

const originCountries = ["México", "Colombia", "Argentina", "España", "USA"];

const ranges: Record<ComfortLevel, {
  flights: [number, number];
  accommodation: [number, number];
  food: [number, number];
  activities: number;
}> = {
  budget:  { flights: [300, 500],  accommodation: [15, 30],   food: [10, 20],  activities: 50 },
  mid:     { flights: [500, 800],  accommodation: [50, 100],  food: [30, 50],  activities: 150 },
  premium: { flights: [800, 1200], accommodation: [150, 300], food: [60, 100], activities: 400 },
};

const gearEstimate: [number, number] = [100, 300];
const insuranceEstimate: [number, number] = [30, 80];

/** Cost-of-living multiplier by destination country (1.0 = baseline) */
const destinationCostMultiplier: Record<string, number> = {
  "Estados Unidos": 1.3,
  "Chile": 0.9,
  "Argentina": 0.7,
  "Perú": 0.65,
  "Colombia": 0.6,
  "México": 0.7,
  "España": 1.1,
  "Nepal": 0.5,
  "Tanzania": 0.75,
  "Noruega": 1.6,
  "Nueva Zelanda": 1.3,
  "Japón": 1.2,
};

/**
 * Flight cost multiplier based on origin→destination proximity.
 * Key format: "Origin" → { "DestinationCountry": multiplier }
 * 1.0 = base range; <1 = cheaper (nearby); >1 = more expensive (far).
 */
const flightMultiplier: Record<string, Record<string, number>> = {
  "México": {
    "México": 0.4, "Estados Unidos": 0.6, "Colombia": 0.8, "Perú": 0.9,
    "Argentina": 1.1, "Chile": 1.1, "España": 1.3, "Nepal": 1.6, "Tanzania": 1.5,
    "Noruega": 1.4, "Nueva Zelanda": 1.7, "Japón": 1.5,
  },
  "Colombia": {
    "Colombia": 0.4, "Perú": 0.5, "México": 0.7, "Chile": 0.8, "Argentina": 0.8,
    "Estados Unidos": 0.8, "España": 1.2, "Nepal": 1.5, "Tanzania": 1.5,
    "Noruega": 1.4, "Nueva Zelanda": 1.7, "Japón": 1.5,
  },
  "Argentina": {
    "Argentina": 0.4, "Chile": 0.5, "Perú": 0.7, "Colombia": 0.8, "México": 1.0,
    "Estados Unidos": 1.1, "España": 1.2, "Nepal": 1.5, "Tanzania": 1.4,
    "Noruega": 1.4, "Nueva Zelanda": 1.5, "Japón": 1.5,
  },
  "España": {
    "España": 0.3, "Noruega": 0.5, "Tanzania": 0.8, "Nepal": 1.0, "Japón": 1.2,
    "México": 1.2, "Colombia": 1.2, "Perú": 1.3, "Argentina": 1.3, "Chile": 1.3,
    "Estados Unidos": 1.0, "Nueva Zelanda": 1.6,
  },
  "USA": {
    "Estados Unidos": 0.4, "México": 0.5, "Colombia": 0.7, "Perú": 0.9,
    "Argentina": 1.1, "Chile": 1.1, "España": 1.0, "Nepal": 1.4, "Tanzania": 1.4,
    "Noruega": 1.1, "Nueva Zelanda": 1.5, "Japón": 1.3,
  },
};

const BudgetCalculator = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [origin, setOrigin] = useState("");
  const [days, setDays] = useState(5);
  const [comfort, setComfort] = useState<ComfortLevel>("mid");
  const [calculated, setCalculated] = useState(false);
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailDone, setEmailDone] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Calculadora de Presupuesto | Nomaderia";
    supabase
      .from("destinations")
      .select("id, title, slug, country, estimated_budget_usd, days_needed, difficulty_level, affiliate_links")
      .eq("is_published", true)
      .order("title")
      .then(({ data }) => {
        if (data) setDestinations(data);
      });
  }, []);

  const selectedDest = destinations.find((d) => d.slug === selectedSlug);
  const r = ranges[comfort];

  const breakdown = useMemo(() => {
    if (!calculated) return null;

    const destCountry = selectedDest?.country || "";
    const costMult = destinationCostMultiplier[destCountry] ?? 1.0;
    const flightMult = (origin && destCountry) ? (flightMultiplier[origin]?.[destCountry] ?? 1.0) : 1.0;

    const flightsLow = Math.round(r.flights[0] * flightMult);
    const flightsHigh = Math.round(r.flights[1] * flightMult);
    const accomLow = Math.round(r.accommodation[0] * costMult) * days;
    const accomHigh = Math.round(r.accommodation[1] * costMult) * days;
    const foodLow = Math.round(r.food[0] * costMult) * days;
    const foodHigh = Math.round(r.food[1] * costMult) * days;
    const activities = Math.round(r.activities * costMult);
    const gear = gearEstimate;
    const insurance = insuranceEstimate;

    const totalLow = flightsLow + accomLow + foodLow + activities + gear[0] + insurance[0];
    const totalHigh = flightsHigh + accomHigh + foodHigh + activities + gear[1] + insurance[1];

    return {
      items: [
        { label: "Vuelos", icon: Plane, low: flightsLow, high: flightsHigh, color: "hsl(var(--sky))" },
        { label: "Hospedaje", icon: Hotel, low: accomLow, high: accomHigh, color: "hsl(var(--trail))" },
        { label: "Alimentación", icon: UtensilsCrossed, low: foodLow, high: foodHigh, color: "hsl(var(--sunset))" },
        { label: "Actividades", icon: Compass, low: activities, high: activities, color: "hsl(var(--primary))" },
        { label: "Equipo", icon: Backpack, low: gear[0], high: gear[1], color: "hsl(var(--accent))" },
        { label: "Seguro de Viaje", icon: ShieldCheck, low: insurance[0], high: insurance[1], color: "hsl(var(--secondary))" },
      ],
      totalLow,
      totalHigh,
    };
  }, [calculated, comfort, days, r, selectedDest, origin]);

  const handleCalculate = () => {
    if (selectedSlug && days > 0) setCalculated(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setEmailLoading(true);
    try {
      await supabase.from("newsletter_subscribers").insert({ email, source: "calculator" });
      setEmailDone(true);
      toast({ title: "¡Listo! 🎉", description: "Te enviaremos tips para ahorrar en tu aventura." });
    } catch {
      toast({ title: "Error", description: "No pudimos registrar tu correo. Por favor, intenta de nuevo.", variant: "destructive" });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Calculator className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-3xl sm:text-5xl font-bold mb-3">Calculadora de Presupuesto</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Estima cuánto costará tu aventura según destino, duración y estilo de viaje.
          </p>
        </motion.div>
      </section>

      {/* Form */}
      <section className="max-w-2xl mx-auto px-4 pb-8 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Destination */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Destino</label>
            <Select value={selectedSlug} onValueChange={(v) => { setSelectedSlug(v); setCalculated(false); }}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Selecciona un destino" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {destinations.map((d) => (
                  <SelectItem key={d.id} value={d.slug}>{d.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Origin */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">País de origen</label>
            <Select value={origin} onValueChange={setOrigin}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="¿De dónde viajas?" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {originCountries.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Days */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Duración (días)</label>
            <Input
              type="number"
              min={1}
              max={60}
              value={days}
              onChange={(e) => { setDays(Number(e.target.value) || 1); setCalculated(false); }}
              className="bg-muted border-border"
            />
          </div>

          {/* Comfort */}
          <div className="space-y-2 sm:col-span-1 col-span-full">
            <label className="text-sm text-muted-foreground">Nivel de confort</label>
            <div className="flex gap-2">
              {comfortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setComfort(opt.value); setCalculated(false); }}
                  className={`flex-1 min-w-0 rounded-lg border px-3 py-2 text-xs sm:text-sm text-center transition-colors ${
                    comfort === opt.value
                      ? "border-primary bg-primary/20 text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <span className="block text-lg">{opt.emoji}</span>
                  <span className="truncate block">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full text-lg"
          disabled={!selectedSlug || days < 1}
          onClick={handleCalculate}
        >
          Calcular Presupuesto
        </Button>
      </section>

      {/* Results */}
      <AnimatePresence>
        {breakdown && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto px-4 pb-16"
          >
            {/* Total */}
            <div className="text-center mb-10">
              <p className="text-muted-foreground text-sm mb-1">Presupuesto estimado para {days} días</p>
              <h2 className="text-4xl sm:text-5xl font-bold text-primary">
                ${breakdown.totalLow.toLocaleString()} — ${breakdown.totalHigh.toLocaleString()} USD
              </h2>
              {selectedDest && (
                <p className="text-muted-foreground mt-2">
                  {selectedDest.title}, {selectedDest.country}
                </p>
              )}
            </div>

            {/* Visual bar breakdown */}
            <div className="space-y-4 mb-10">
              {breakdown.items.map((item, i) => {
                const maxVal = breakdown.totalHigh;
                const widthPct = Math.max((item.high / maxVal) * 100, 8);
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i, duration: 0.4 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: item.color + "22" }}>
                      <Icon className="h-5 w-5" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground font-medium">{item.label}</span>
                        <span className="text-muted-foreground">
                          ${item.low.toLocaleString()}{item.low !== item.high && ` — $${item.high.toLocaleString()}`}
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPct}%` }}
                          transition={{ delay: 0.15 * i, duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* CTAs */}
            <div className="grid sm:grid-cols-2 gap-3 mb-10">
              {selectedDest?.affiliate_links?.flights_url && (
                <a href={selectedDest.affiliate_links.flights_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2">
                    <Plane className="h-4 w-4" /> Buscar Vuelos <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </a>
              )}
              {selectedDest?.affiliate_links?.hotels_url && (
                <a href={selectedDest.affiliate_links.hotels_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2">
                    <Hotel className="h-4 w-4" /> Buscar Hoteles <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </a>
              )}
              {selectedDest?.affiliate_links?.tours_url && (
                <a href={selectedDest.affiliate_links.tours_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2">
                    <Compass className="h-4 w-4" /> Ver Tours y Actividades <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </a>
              )}
              {selectedDest?.affiliate_links?.insurance_url && (
                <a href={selectedDest.affiliate_links.insurance_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2">
                    <ShieldCheck className="h-4 w-4" /> Seguro de Viaje <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </a>
              )}
              {selectedDest && (
                <Link to={`/destinos/${selectedDest.slug}`}>
                  <Button variant="secondary" className="w-full gap-2">
                    <Compass className="h-4 w-4" /> Ver Guía del Destino <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Email capture */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="rounded-xl border border-border bg-muted/50 p-6 text-center"
            >
              <Mail className="mx-auto h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold text-lg mb-1">¿Quieres tips para ahorrar en tu viaje?</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Recibe consejos de presupuesto, ofertas de vuelos y guías exclusivas.
              </p>
              {emailDone ? (
                <p className="text-primary font-medium">¡Gracias! Te mantendremos al tanto 🏔️</p>
              ) : (
                <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background text-foreground h-11"
                  />
                  <Button type="submit" disabled={emailLoading} className="whitespace-nowrap h-11">
                    {emailLoading ? "..." : "Suscribirme"}
                  </Button>
                </form>
              )}
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default BudgetCalculator;
