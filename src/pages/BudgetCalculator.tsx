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
import { Calculator, Plane, Hotel, UtensilsCrossed, Compass, Backpack, ShieldCheck, ArrowRight, Mail, Tent, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { calculateBudget } from "@/lib/budget-calc";
import type { ComfortLevel } from "@/lib/budget-calc";

interface Destination {
  id: string;
  title: string;
  slug: string;
  country: string;
  estimated_budget_usd: number | null;
  hero_image_url: string | null;
  days_needed: string | null;
  difficulty_level: string;
  affiliate_links: Record<string, string> | null;
}

const comfortOptions: { value: ComfortLevel; label: string; icon: LucideIcon }[] = [
  { value: "budget", label: "Mochilero", icon: Tent },
  { value: "mid", label: "Cómodo", icon: Hotel },
  { value: "premium", label: "Premium", icon: Star },
];

const originZones = [
  "Tijuana / Baja California",
  "San Diego / Sur de California",
  "Ciudad de México (CDMX)",
  "Resto de México",
  "Resto de Estados Unidos",
  "Otro lugar",
];

const BudgetCalculator = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [origin, setOrigin] = useState("");
  const [days, setDays] = useState(5);
  const [comfort, setComfort] = useState<ComfortLevel>("mid");
  const [flightCost, setFlightCost] = useState(0);
  const [calculated, setCalculated] = useState(false);
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailDone, setEmailDone] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Calculadora de Presupuesto | Nomaderia";
    supabase
      .from("destinations")
      .select("id, title, slug, country, estimated_budget_usd, hero_image_url, days_needed, difficulty_level, affiliate_links")
      .eq("is_published", true)
      .order("title")
      .then(({ data, error }) => {
        if (error) {
          console.error("[BudgetCalculator] Error fetching destinations:", error.message);
          return;
        }
        if (data) setDestinations(data);
      });
  }, []);

  const selectedDest = destinations.find((d) => d.slug === selectedSlug);

  const breakdown = useMemo(() => {
    if (!calculated || !selectedDest) return null;

    const b = calculateBudget(selectedDest.estimated_budget_usd, comfort, days, flightCost);

    return {
      items: [
        { label: "Vuelos", icon: Plane, amount: b.flights, color: "hsl(var(--sky))" },
        { label: "Hospedaje", icon: Hotel, amount: b.accommodation, color: "hsl(var(--trail))" },
        { label: "Alimentación", icon: UtensilsCrossed, amount: b.food, color: "hsl(var(--sunset))" },
        { label: "Actividades", icon: Compass, amount: b.activities, color: "hsl(var(--primary))" },
        { label: "Equipo", icon: Backpack, amount: b.gear, color: "hsl(var(--accent))" },
        { label: "Seguro de Viaje", icon: ShieldCheck, amount: b.insurance, color: "hsl(var(--secondary))" },
      ],
      total: b.total,
    };
  }, [calculated, days, comfort, selectedDest, flightCost]);

  const handleCalculate = () => {
    if (selectedSlug && days > 0) setCalculated(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setEmailLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email, source: "calculator" });

      if (error) {
        toast({
          title: "Error",
          description:
            error.message ||
            "No pudimos registrar tu correo. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
        return;
      }

      setEmailDone(true);
      toast({
        title: "¡Listo! 🎉",
        description: "Te enviaremos tips para ahorrar en tu aventura.",
      });
    } catch {
      toast({
        title: "Error",
        description: "No pudimos registrar tu correo. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
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

      {/* Two-column layout */}
      <section className="max-w-6xl mx-auto px-4 pb-8 grid lg:grid-cols-2 gap-10">
        {/* Left: Form */}
        <div className="space-y-6">
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
              <label className="text-sm text-muted-foreground">¿Desde qué zona viajarías?</label>
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Selecciona tu zona" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {originZones.map((z) => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
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

            {/* Flight Cost */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Costo de vuelos/transporte (USD)</label>
              <Input
                type="number"
                min={0}
                value={flightCost}
                onChange={(e) => { setFlightCost(Number(e.target.value) || 0); setCalculated(false); }}
                className="bg-muted border-border"
                placeholder="0"
              />
            </div>

            {/* Comfort */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm text-muted-foreground">Nivel de confort</label>
              <div className="flex gap-2">
                {comfortOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => { setComfort(opt.value); setCalculated(false); }}
                      className={`flex-1 min-w-0 rounded-lg border px-3 py-2 text-xs sm:text-sm text-center transition-colors ${
                        comfort === opt.value
                          ? "border-primary bg-primary/20 text-primary-foreground"
                          : "border-border bg-muted text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <Icon className="mx-auto h-5 w-5 mb-1" />
                      <span className="truncate block">{opt.label}</span>
                    </button>
                  );
                })}
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
        </div>

        {/* Right: Results + Image */}
        <div>
          <AnimatePresence>
            {breakdown && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Destination image */}
                {selectedDest?.hero_image_url && (
                  <motion.img
                    src={selectedDest.hero_image_url}
                    alt={selectedDest.title}
                    className="w-full h-48 object-cover rounded-xl mb-6"
                    loading="lazy"
                    decoding="async"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  />
                )}

                {/* Total */}
                <div className="text-center mb-8">
                  <p className="text-muted-foreground text-sm mb-1">Presupuesto estimado para {days} días</p>
                  <h2 className="text-4xl sm:text-5xl font-bold text-primary">
                    ${breakdown.total.toLocaleString()} USD
                  </h2>
                  {selectedDest && (
                    <p className="text-muted-foreground mt-2">
                      {selectedDest.title}, {selectedDest.country}
                      {origin && <> · Desde: {origin}</>}
                    </p>
                  )}
                </div>

                {/* Visual bar breakdown */}
                <div className="space-y-4 mb-8">
                  {breakdown.items.map((item, i) => {
                    const maxVal = breakdown.total;
                    const widthPct = maxVal > 0 ? Math.max((item.amount / maxVal) * 100, 8) : 8;
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
                              ${item.amount.toLocaleString()}
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

                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground text-center mb-8">
                  Estimaciones basadas en costos reales de mercado. Vuelos calculados según tu entrada.
                </p>

                {/* CTAs */}
                <div className="grid sm:grid-cols-2 gap-3 mb-8">
                  {selectedDest?.affiliate_links?.flights_url &&
                    /^https?:\/\//i.test(selectedDest.affiliate_links.flights_url) && (
                      <a href={selectedDest.affiliate_links.flights_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full gap-2">
                          <Plane className="h-4 w-4" /> Buscar Vuelos <ArrowRight className="h-4 w-4 ml-auto" />
                        </Button>
                      </a>
                    )}
                  {selectedDest?.affiliate_links?.hotels_url &&
                    /^https?:\/\//i.test(selectedDest.affiliate_links.hotels_url) && (
                      <a href={selectedDest.affiliate_links.hotels_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full gap-2">
                          <Hotel className="h-4 w-4" /> Buscar Hoteles <ArrowRight className="h-4 w-4 ml-auto" />
                        </Button>
                      </a>
                    )}
                  {selectedDest?.affiliate_links?.tours_url &&
                    /^https?:\/\//i.test(selectedDest.affiliate_links.tours_url) && (
                      <a href={selectedDest.affiliate_links.tours_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full gap-2">
                          <Compass className="h-4 w-4" /> Ver Tours y Actividades <ArrowRight className="h-4 w-4 ml-auto" />
                        </Button>
                      </a>
                    )}
                  {selectedDest?.affiliate_links?.insurance_url &&
                    /^https?:\/\//i.test(selectedDest.affiliate_links.insurance_url) && (
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BudgetCalculator;
