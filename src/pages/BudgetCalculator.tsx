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
import { Plane, Hotel, UtensilsCrossed, Compass, Backpack, ShieldCheck, ArrowRight, Mail, Tent, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { calculateBudget } from "@/lib/budget-calc";
import type { ComfortLevel } from "@/lib/budget-calc";
import { useDestinations } from "@/hooks/use-destinations";
import type { DestinationCard } from "@/hooks/use-destinations";
import { useCanonical, usePageMeta } from "@/hooks/use-seo";

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

const HeroSlider = ({ images }: { images: string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(id);
  }, [images.length]);

  if (images.length === 0) {
    return <div className="absolute inset-0 bg-neutral-800" />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.img
        key={images[index]}
        src={images[index]}
        alt=""
        role="presentation"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        loading="eager"
        decoding="async"
      />
    </AnimatePresence>
  );
};

const BudgetCalculator = () => {
  useCanonical();
  usePageMeta({
    title: "Calculadora de Presupuesto para tu Aventura | Nomaderia",
    description: "Calcula cuánto cuesta tu viaje a los parques nacionales. Estimados reales en dólares para viajeros hispanos en EE. UU.",
  });
  const { data: destinations = [] } = useDestinations();
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

  /* ---------- Hero image slider ---------- */
  const heroImages = useMemo(
    () =>
      destinations
        .filter(
          (d): d is DestinationCard & { hero_image_url: string } =>
            !!d.hero_image_url,
        )
        .slice(0, 5)
        .map((d) => d.hero_image_url),
    [destinations],
  );

  useEffect(() => {
    document.title = "Calculadora de Presupuesto | Nomaderia";
  }, []);

  const selectedDest = useMemo(
    () => destinations.find((d) => d.slug === selectedSlug),
    [destinations, selectedSlug]
  );

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
    <div className="min-h-screen bg-neutral-50 dark:bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 pb-24">
        {/* Hero Section */}
        <section className="relative h-[45vh] min-h-[380px] flex items-center justify-center overflow-hidden bg-neutral-900">
          <HeroSlider images={heroImages} />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-neutral-50 dark:to-background pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 text-center px-4 w-full max-w-4xl mx-auto -mt-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mx-auto"
            >
              <h1
                className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-xl"
              >
                Calculadora de Presupuesto
              </h1>
              <p
                className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-sans font-light drop-shadow-md"
              >
                Planifica tu próxima aventura con estimaciones reales para tu viaje.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Main Content Layout */}
        <section className="max-w-6xl mx-auto px-4 -mt-20 relative z-20">
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Form */}
            <div className="lg:col-span-5 xl:col-span-4 bg-card border border-border/50 rounded-2xl shadow-xl p-6 sm:p-8 backdrop-blur-xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold font-serif mb-1 text-foreground">Configura tu Viaje</h2>
                <p className="text-sm text-muted-foreground">Ajusta los detalles para obtener un estimado preciso.</p>
              </div>

              <div className="space-y-5">
                {/* Destination */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Compass className="w-4 h-4 text-primary" /> Destino
                  </label>
                  <Select value={selectedSlug} onValueChange={(v) => { setSelectedSlug(v); setCalculated(false); }}>
                    <SelectTrigger className="bg-background border-border shadow-sm h-11">
                      <SelectValue placeholder="¿A dónde quieres ir?" />
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
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Plane className="w-4 h-4 text-primary" /> Punto de partida
                  </label>
                  <Select value={origin} onValueChange={setOrigin}>
                    <SelectTrigger className="bg-background border-border shadow-sm h-11">
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
                  <label className="text-sm font-medium text-foreground">Duración (días)</label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={days}
                    onChange={(e) => { setDays(Number(e.target.value) || 1); setCalculated(false); }}
                    className="bg-background border-border shadow-sm h-11 text-base"
                  />
                </div>

                {/* Flight Cost */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Costo de vuelos (USD)</label>
                  <Input
                    type="number"
                    min={0}
                    value={flightCost}
                    onChange={(e) => { setFlightCost(Number(e.target.value) || 0); setCalculated(false); }}
                    className="bg-background border-border shadow-sm h-11 text-base"
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">Si ya conoces el costo, ingrésalo aquí.</p>
                </div>

                {/* Comfort */}
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-medium text-foreground">Estilo de viaje</label>
                  <div className="grid grid-cols-3 gap-2">
                    {comfortOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = comfort === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => { setComfort(opt.value); setCalculated(false); }}
                          className={`flex flex-col items-center justify-center rounded-xl border p-3 transition-all duration-200 ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary"
                              : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted"
                          }`}
                        >
                          <Icon className={`h-5 w-5 mb-1.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="text-xs font-medium w-full text-center truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full text-base h-12 mt-8 rounded-xl font-medium shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
                disabled={!selectedSlug || days < 1}
                onClick={handleCalculate}
              >
                Calcular Presupuesto
              </Button>
            </div>

            {/* Right: Results + Image */}
            <div className="lg:col-span-7 xl:col-span-8 lg:sticky lg:top-24">
              <AnimatePresence mode="wait">
                {!calculated ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border/60 rounded-2xl bg-card/50"
                  >
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                      <Compass className="h-10 w-10 text-primary/60" />
                    </div>
                    <h3 className="text-2xl font-serif font-medium text-foreground mb-3">Descubre tu presupuesto ideal</h3>
                    <p className="text-muted-foreground max-w-md mx-auto text-sm">
                      Completa la información en el panel izquierdo y haz clic en calcular para ver un desglose detallado de los costos de tu viaje.
                    </p>
                  </motion.div>
                ) : breakdown && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden"
                  >
                    {/* Destination Image Header */}
                    {selectedDest?.hero_image_url && (
                      <div className="relative h-48 sm:h-56 w-full">
                        <img
                          src={selectedDest.hero_image_url}
                          alt={selectedDest.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                        <div className="absolute bottom-4 left-6 right-6 text-white">
                          <p className="text-white/80 text-sm font-medium mb-1 drop-shadow-sm">Presupuesto estimado para {days} días</p>
                          <h2 className="text-3xl sm:text-4xl font-bold drop-shadow-md">
                            ${breakdown.total.toLocaleString()} <span className="text-xl font-normal opacity-80">USD</span>
                          </h2>
                        </div>
                      </div>
                    )}

                    <div className="p-6 sm:p-8">
                      {/* Destination Summary */}
                      <div className="mb-8 pb-6 border-b border-border/50 flex flex-wrap gap-y-2 justify-between items-end">
                        <div>
                          <h3 className="text-xl font-bold text-foreground">
                            {selectedDest?.title}, {selectedDest?.country}
                          </h3>
                          {origin && <p className="text-sm text-muted-foreground mt-1">Desde: {origin}</p>}
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            <Star className="w-3.5 h-3.5" />
                            {comfortOptions.find((c) => c.value === comfort)?.label}
                          </span>
                        </div>
                      </div>

                      {/* Visual bar breakdown */}
                      <div className="space-y-5 mb-8">
                        {breakdown.items.map((item, i) => {
                          const maxVal = breakdown.total;
                          const widthPct = maxVal > 0 ? Math.max((item.amount / maxVal) * 100, 4) : 4;
                          const Icon = item.icon;
                          return (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * i, duration: 0.4 }}
                              className="group"
                            >
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-foreground font-medium flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" style={{ color: item.color }} />
                                  {item.label}
                                </span>
                                <span className="font-semibold text-foreground">
                                  ${item.amount.toLocaleString()}
                                </span>
                              </div>
                              <div className="h-2.5 rounded-full bg-muted overflow-hidden relative">
                                <motion.div
                                  className="absolute top-0 left-0 h-full rounded-full"
                                  style={{ backgroundColor: item.color }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${widthPct}%` }}
                                  transition={{ delay: 0.2 + 0.1 * i, duration: 0.7, ease: "easeOut" }}
                                />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      <p className="text-xs text-muted-foreground text-center mb-8 bg-muted/30 py-3 rounded-lg">
                        Estimaciones basadas en costos reales de mercado. Vuelos calculados según tu entrada.
                      </p>

                      {/* CTAs */}
                      <div className="grid sm:grid-cols-2 gap-3 mb-8">
                        {selectedDest?.affiliate_links?.flights_url &&
                          /^https?:\/\//i.test(selectedDest.affiliate_links.flights_url) && (
                            <a href={selectedDest.affiliate_links.flights_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" className="w-full gap-2 h-11 hover:bg-primary/5 hover:text-primary transition-colors">
                                <Plane className="h-4 w-4" /> Buscar Vuelos <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                              </Button>
                            </a>
                          )}
                        {selectedDest?.affiliate_links?.hotels_url &&
                          /^https?:\/\//i.test(selectedDest.affiliate_links.hotels_url) && (
                            <a href={selectedDest.affiliate_links.hotels_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" className="w-full gap-2 h-11 hover:bg-primary/5 hover:text-primary transition-colors">
                                <Hotel className="h-4 w-4" /> Buscar Hoteles <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                              </Button>
                            </a>
                          )}
                        {selectedDest?.affiliate_links?.tours_url &&
                          /^https?:\/\//i.test(selectedDest.affiliate_links.tours_url) && (
                            <a href={selectedDest.affiliate_links.tours_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" className="w-full gap-2 h-11 hover:bg-primary/5 hover:text-primary transition-colors">
                                <Compass className="h-4 w-4" /> Tours y Actividades <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                              </Button>
                            </a>
                          )}
                        {selectedDest?.affiliate_links?.insurance_url &&
                          /^https?:\/\//i.test(selectedDest.affiliate_links.insurance_url) && (
                            <a href={selectedDest.affiliate_links.insurance_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" className="w-full gap-2 h-11 hover:bg-primary/5 hover:text-primary transition-colors">
                                <ShieldCheck className="h-4 w-4" /> Seguro de Viaje <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                              </Button>
                            </a>
                          )}
                        {selectedDest && (
                          <Link to={`/destinos/${selectedDest.slug}`} className="sm:col-span-2 mt-2">
                            <Button className="w-full gap-2 h-12 text-base">
                              <Compass className="h-5 w-5" /> Ver Guía del Destino <ArrowRight className="h-5 w-5 ml-auto" />
                            </Button>
                          </Link>
                        )}
                      </div>

                      {/* Email capture */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                        className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center relative overflow-hidden"
                      >
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="relative z-10">
                          <Mail className="mx-auto h-8 w-8 text-primary mb-3" />
                          <h3 className="font-semibold text-lg mb-1 text-foreground">¿Quieres tips para ahorrar en tu viaje?</h3>
                          <p className="text-muted-foreground text-sm mb-5">
                            Recibe consejos de presupuesto, ofertas de vuelos y guías exclusivas.
                          </p>
                          {emailDone ? (
                            <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-3 rounded-lg font-medium inline-flex items-center gap-2">
                              ¡Gracias! Te mantendremos al tanto 🏔️
                            </div>
                          ) : (
                            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                              <Input
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-background border-border shadow-sm h-11 flex-1"
                              />
                              <Button type="submit" disabled={emailLoading} className="whitespace-nowrap h-11 shadow-sm">
                                {emailLoading ? "Suscribiendo..." : "Suscribirme"}
                              </Button>
                            </form>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BudgetCalculator;
