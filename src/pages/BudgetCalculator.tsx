import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calculator, Mail, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDestinations } from "@/hooks/use-destinations";
import { useCanonical, usePageMeta } from "@/hooks/use-seo";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_LINK_ITINERARIO_49 } from "@/config/pricing";
import {
  calculateBudget,
  resolveTransport,
  STYLE_LABELS,
  type ComfortLevel,
  type TransportMode,
  type BudgetLine,
} from "@/lib/budget-calc";
import {
  driveFromOrigin,
  originFromZip,
  readSavedOrigin,
  saveOrigin,
  SAN_DIEGO_ORIGIN,
  isSanDiegoArea,
  type RouteOrigin,
} from "@/lib/landing-origin";
import { isValidZipFormat, lookupZip, preloadZipTable } from "@/lib/zip-centroids";
import { trackEvent } from "@/lib/analytics";

const UNIQUE_VIOLATION = "23505";

/** Design-system hex tokens (no --accent / --sunset). */
const BAR_COLORS: Record<string, string> = {
  gas: "#1F6F43",
  flights: "#2E6F9E",
  car_rental: "#166534",
  entrance: "#6E7A74",
  lodging: "#14201A",
  food: "#C2562F",
  gear: "#13211A",
};

const formSchema = z.object({
  destinationId: z.string().min(1, "Elige un destino"),
  zip: z.string().regex(/^\d{5}$/, "Código postal de 5 dígitos"),
  people: z.coerce.number().int().min(1).max(8),
  days: z.coerce.number().int().min(1).max(14),
  style: z.enum(["budget", "mid", "premium"]),
  transport: z.enum(["driving", "flying"]),
  flightPricePerPerson: z
    .union([
      z.literal(""),
      z.coerce.number().min(0, "No se aceptan precios negativos"),
    ])
    .optional(),
  hasGear: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function initialOrigin(): RouteOrigin {
  const saved = readSavedOrigin();
  if (!saved || saved.kind !== "zip" || isSanDiegoArea(saved)) {
    return SAN_DIEGO_ORIGIN;
  }
  return saved;
}

function initialZip(): string {
  const saved = readSavedOrigin();
  if (saved?.kind === "zip") return saved.zip;
  return "92101";
}

export default function BudgetCalculator() {
  useCanonical();
  usePageMeta({
    title: "Calculadora de Presupuesto para tu Aventura",
    description:
      "Estima gasolina, entrada NPS, hospedaje y comida para tu próximo parque nacional desde California.",
  });

  const { data: destinations = [], isLoading } = useDestinations();
  const [origin, setOrigin] = useState<RouteOrigin>(initialOrigin);

  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destinationId: "",
      zip: initialZip(),
      people: 2,
      days: 3,
      style: "mid",
      transport: "driving",
      flightPricePerPerson: "",
      hasGear: false,
    },
    mode: "onChange",
  });

  const values = watch();
  const destination = useMemo(
    () => destinations.find((d) => d.id === values.destinationId) ?? null,
    [destinations, values.destinationId],
  );

  // Resolve + persist origin whenever ZIP is a valid 5-digit code.
  useEffect(() => {
    const zip = values.zip;
    if (!isValidZipFormat(zip)) return;
    let cancelled = false;
    (async () => {
      try {
        const point = await lookupZip(zip);
        if (cancelled || !point) return;
        const next = originFromZip(zip, point);
        if (!cancelled) {
          setOrigin(next);
          saveOrigin(next);
        }
      } catch {
        // Table fetch failed — keep prior origin; calc still works from San Diego hours.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [values.zip]);

  const drive = useMemo(() => {
    if (!destination) return null;
    return driveFromOrigin(origin, {
      latitude: destination.latitude,
      longitude: destination.longitude,
      drive_time_from_san_diego: destination.drive_time_from_san_diego,
    });
  }, [destination, origin]);

  // When no destination yet, don't force flying.
  const activeChoice = destination
    ? resolveTransport(drive ? drive.hours : null)
    : { mode: "driving" as const, forcedFlying: false, message: null };

  const lastSeedKey = useRef<string>("");
  useEffect(() => {
    if (!destination) return;
    const key = `${destination.id}:${drive?.hours ?? "null"}`;
    if (activeChoice.forcedFlying) {
      setValue("transport", "flying", { shouldValidate: true });
      lastSeedKey.current = key;
      return;
    }
    if (lastSeedKey.current !== key) {
      setValue("transport", activeChoice.mode, { shouldValidate: true });
      lastSeedKey.current = key;
    }
  }, [destination, drive, activeChoice, setValue]);

  const flightRaw = values.flightPricePerPerson;
  const flightPrice =
    flightRaw === "" || flightRaw === undefined || flightRaw === null
      ? null
      : Number(flightRaw);

  const effectiveTransport: TransportMode = activeChoice.forcedFlying
    ? "flying"
    : ((values.transport as TransportMode) || "driving");

  const budget = useMemo(() => {
    if (!destination) return null;
    if (!isValidZipFormat(values.zip)) return null;
    const people = Number(values.people);
    const days = Number(values.days);
    if (!Number.isFinite(people) || !Number.isFinite(days) || people < 1 || days < 1) {
      return null;
    }
    try {
      return calculateBudget({
        people,
        days,
        style: values.style as ComfortLevel,
        transport: effectiveTransport,
        driveHours: drive ? drive.hours : null,
        zip: values.zip,
        entranceFeeUsd: destination.entrance_fee_usd,
        flightPricePerPerson:
          Number.isFinite(flightPrice as number) ? (flightPrice as number) : null,
        hasGear: Boolean(values.hasGear),
      });
    } catch {
      return null;
    }
  }, [
    destination,
    values.zip,
    values.people,
    values.days,
    values.style,
    values.hasGear,
    drive,
    effectiveTransport,
    flightPrice,
  ]);

  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim()) return;
      setEmailStatus("loading");
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email: email.trim().toLowerCase(),
        source: "calculator",
      });
      if (error) {
        if (error.code === UNIQUE_VIOLATION) {
          setEmailStatus("success");
          toast.success("Ya estás suscrito 🙌");
          return;
        }
        setEmailStatus("idle");
        toast.error("No pudimos guardar tu correo. Intenta de nuevo.");
        return;
      }
      setEmailStatus("success");
      trackEvent("calculator_email_submit", destination?.slug ? { destination: destination.slug } : undefined);
      toast.success("¡Listo! Te avisamos cuando publiquemos más guías.");
    },
    [email, destination?.slug],
  );

  const visibleLines: BudgetLine[] = budget
    ? budget.lines.filter((l) => l.alwaysShow || l.amount > 0 || l.excludeFromTotal)
    : [];
  const maxAmount = Math.max(...visibleLines.map((l) => l.amount), 1);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Dark band so Navbar (hasHero for /calculadora) stays readable. */}
        <section className="relative bg-forest-dark pt-24 pb-12 md:pb-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cloud/10">
                <Calculator className="h-5 w-5 text-cloud" aria-hidden />
              </div>
              <p className="text-sm font-medium text-cloud/80">Herramienta gratis</p>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-cloud mb-3">
              Calculadora de presupuesto
            </h1>
            <p className="text-cloud/80 text-base md:text-lg max-w-2xl">
              Números honestos para viajar a parques nacionales desde el Sur de California:
              gasolina, entrada oficial del NPS, hospedaje y comida.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* 1 Destino */}
            <div className="space-y-2">
              <Label htmlFor="destinationId">Destino</Label>
              <Controller
                name="destinationId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="destinationId" className="w-full h-11">
                      <SelectValue
                        placeholder={isLoading ? "Cargando destinos…" : "Elige un parque"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.destinationId && (
                <p className="text-sm text-destructive">{errors.destinationId.message}</p>
              )}
            </div>

            {/* 2 ZIP */}
            <div className="space-y-2">
              <Label htmlFor="zip">Código postal</Label>
              <Input
                id="zip"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                placeholder="92101"
                className="h-11 tracking-widest"
                onFocus={preloadZipTable}
                {...register("zip", {
                  onChange: (e) => {
                    const digits = String(e.target.value).replace(/\D/g, "").slice(0, 5);
                    setValue("zip", digits, { shouldValidate: true });
                  },
                })}
              />
              {errors.zip && (
                <p className="text-sm text-destructive">{errors.zip.message}</p>
              )}
            </div>

            {/* 3 People */}
            <div className="space-y-2">
              <Label htmlFor="people">¿Cuántos viajan?</Label>
              <Input
                id="people"
                type="number"
                min={1}
                max={8}
                className="h-11"
                {...register("people")}
              />
              {errors.people && (
                <p className="text-sm text-destructive">Entre 1 y 8 personas</p>
              )}
            </div>

            {/* 4 Days — clearable while typing; clamp on blur */}
            <div className="space-y-2">
              <Label htmlFor="days">Días</Label>
              <Controller
                name="days"
                control={control}
                render={({ field }) => (
                  <Input
                    id="days"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={14}
                    className="h-11"
                    value={
                      field.value === undefined ||
                      field.value === null ||
                      (field.value as unknown) === ""
                        ? ""
                        : field.value
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        field.onChange("" as unknown as number);
                        return;
                      }
                      field.onChange(Number(raw));
                    }}
                    onBlur={() => {
                      const current = getValues("days");
                      const n = Number(current);
                      if (!Number.isFinite(n) || n < 1) {
                        setValue("days", 1, { shouldValidate: true });
                      } else if (n > 14) {
                        setValue("days", 14, { shouldValidate: true });
                      } else {
                        setValue("days", Math.round(n), { shouldValidate: true });
                      }
                      field.onBlur();
                    }}
                  />
                )}
              />
              {errors.days && (
                <p className="text-sm text-destructive">Entre 1 y 14 días</p>
              )}
            </div>

            {/* 5 Style */}
            <div className="space-y-2">
              <Label>Estilo</Label>
              <Controller
                name="style"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(STYLE_LABELS) as ComfortLevel[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => field.onChange(key)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                          field.value === key
                            ? "border-green bg-green-wash text-foreground ring-1 ring-green"
                            : "border-border bg-card text-foreground/80 hover:border-green/40"
                        }`}
                      >
                        {STYLE_LABELS[key]}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            {/* 6 Transport */}
            <div className="space-y-2">
              <Label>¿Cómo llegas?</Label>
              <Controller
                name="transport"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ["driving", "Manejando"],
                        ["flying", "Volando"],
                      ] as const
                    ).map(([mode, label]) => {
                      const disabled =
                        activeChoice.forcedFlying && mode === "driving";
                      return (
                        <button
                          key={mode}
                          type="button"
                          disabled={disabled}
                          onClick={() => field.onChange(mode)}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            field.value === mode
                              ? "border-green bg-green-wash text-foreground ring-1 ring-green"
                              : "border-border bg-card text-foreground/80 hover:border-green/40"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {activeChoice.message && (
                <p className="text-sm text-muted-foreground">{activeChoice.message}</p>
              )}
            </div>

            {/* 7 Flight price */}
            {effectiveTransport === "flying" && (
              <div className="space-y-2">
                <Label htmlFor="flightPricePerPerson">
                  Precio del vuelo por persona (USD){" "}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="flightPricePerPerson"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="1"
                  placeholder="Ej. 180"
                  className="h-11"
                  {...register("flightPricePerPerson")}
                />
                {errors.flightPricePerPerson && (
                  <p className="text-sm text-destructive">
                    {errors.flightPricePerPerson.message}
                  </p>
                )}
              </div>
            )}

            {/* 8 Gear */}
            <div className="flex items-start gap-3">
              <Controller
                name="hasGear"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="hasGear"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  />
                )}
              />
              <Label htmlFor="hasGear" className="font-normal leading-snug cursor-pointer">
                Ya tengo equipo
              </Label>
            </div>
          </form>

          {budget && destination && (
            <div className="mt-10 rounded-2xl border border-border bg-card p-5 md:p-7 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-foreground mb-1">
                Estimado para {destination.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {budget.people} {budget.people === 1 ? "persona" : "personas"} ·{" "}
                {budget.days} {budget.days === 1 ? "día" : "días"} ·{" "}
                {STYLE_LABELS[budget.style]} ·{" "}
                {effectiveTransport === "driving" ? "Manejando" : "Volando"}
              </p>

              <ul className="space-y-4 mb-6">
                {visibleLines.map((line) => {
                  const widthPct =
                    line.amount <= 0 ? 0 : Math.round((line.amount / maxAmount) * 100);
                  const color = BAR_COLORS[line.id] ?? "#1F6F43";
                  return (
                    <li key={line.id}>
                      <div className="flex items-baseline justify-between gap-3 mb-1">
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-foreground">
                            {line.label}
                          </span>
                          {line.tag && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              {line.tag}
                            </span>
                          )}
                          {line.subtext && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {line.subtext}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-foreground tabular-nums shrink-0">
                          {line.displayAmount ?? formatUsd(line.amount)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        {widthPct > 0 && (
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${widthPct}%`, backgroundColor: color }}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-border pt-4 mb-2">
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-lg font-bold text-foreground">Total</span>
                  <span className="font-serif text-2xl font-bold text-foreground tabular-nums">
                    {formatUsd(budget.total)}
                  </span>
                </div>
                {budget.flightsPending && (
                  <p className="text-right text-sm text-muted-foreground">+ vuelos</p>
                )}
                <p className="text-right text-sm text-muted-foreground mt-1">
                  ≈ {formatUsd(budget.perPerson)} por persona
                </p>
              </div>

              <p className="text-xs text-muted-foreground mt-4 mb-6 leading-relaxed">
                La entrada es dato oficial del NPS. Gasolina, hospedaje y comida son estimados;
                tu itinerario trae precios exactos.
              </p>

              <div className="flex flex-col gap-3">
                <Button asChild size="lg" className="w-full">
                  <a
                    href={STRIPE_LINK_ITINERARIO_49}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackEvent("calculator_stripe_cta", {
                        destination: destination.slug,
                        total: budget.total,
                      })
                    }
                  >
                    Quiero mi itinerario completo – $49
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link to={`/destinos/${destination.slug}`}>Ver guía del destino</Link>
                </Button>
              </div>
            </div>
          )}

          <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-5 md:p-7">
            <div className="flex items-start gap-3 mb-4">
              <Mail className="h-5 w-5 text-green mt-0.5 shrink-0" aria-hidden />
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground">
                  Avísame de nuevas guías
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Sin spam. Solo cuando publiquemos un itinerario útil para ti.
                </p>
              </div>
            </div>
            {emailStatus === "success" ? (
              <div className="flex items-center gap-2 text-sm text-green">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Ya estás en la lista. Gracias.
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-11"
                  autoComplete="email"
                />
                <Button type="submit" disabled={emailStatus === "loading"}>
                  {emailStatus === "loading" ? "Enviando…" : "Suscribirme"}
                </Button>
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
