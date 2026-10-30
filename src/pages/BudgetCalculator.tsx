import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, CheckCircle2, ArrowRight, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PageHeader from "@/components/shared/PageHeader";
import CalculatorScene from "@/components/calculator/CalculatorScene";
import PeopleStepper from "@/components/calculator/PeopleStepper";
import BudgetPass from "@/components/calculator/BudgetPass";
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
  budgetShareText,
  calculateBudget,
  resolveCalculatorTransport,
  resolveDriveHoursForCalc,
  STYLE_LABELS,
  transportToSeed,
  type ComfortLevel,
  type TransportMode,
} from "@/lib/budget-calc";
import { landmarkForSlug } from "@/lib/calculator-scene";
import { buildWhatsAppShareLink } from "@/lib/whatsapp";
import {
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
  /** True when lookupZip returned null for the current 5-digit ZIP. */
  const [zipLookupFailed, setZipLookupFailed] = useState(false);

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
    if (!isValidZipFormat(zip)) {
      setZipLookupFailed(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const point = await lookupZip(zip);
        if (cancelled) return;
        if (!point) {
          // Unknown ZIP: keep prior origin untouched, hide results, show error.
          setZipLookupFailed(true);
          return;
        }
        setZipLookupFailed(false);
        const next = originFromZip(zip, point);
        setOrigin(next);
        saveOrigin(next);
      } catch {
        // Table fetch failed — keep prior origin; calc still works from San Diego hours.
        if (!cancelled) setZipLookupFailed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [values.zip]);

  const drive = useMemo(() => {
    if (!destination) return null;
    return resolveDriveHoursForCalc(origin, {
      latitude: destination.latitude,
      longitude: destination.longitude,
      drive_time_from_san_diego: destination.drive_time_from_san_diego,
    });
  }, [destination, origin]);

  // When no destination yet, don't force flying. Off-route ZIPs force Volando.
  const activeChoice = destination
    ? resolveCalculatorTransport(drive ? drive.hours : null, values.zip)
    : { mode: "driving" as const, forcedFlying: false, message: null };

  // Seed the transport default. Deps are primitives on purpose: activeChoice
  // is a new object every render, and setValue re-renders the form, so an
  // unguarded write loops forever (transportToSeed).
  const lastSeedKey = useRef<string>("");
  const destinationId = destination?.id ?? null;
  const driveHours = drive?.hours ?? null;
  const { forcedFlying, mode: defaultMode } = activeChoice;
  useEffect(() => {
    if (!destinationId) return;
    const key = `${destinationId}:${driveHours ?? "null"}:${values.zip}`;
    const next = transportToSeed(
      getValues("transport"),
      { mode: defaultMode, forcedFlying, message: null },
      lastSeedKey.current !== key,
    );
    lastSeedKey.current = key;
    if (next) setValue("transport", next, { shouldValidate: true });
  }, [destinationId, driveHours, values.zip, forcedFlying, defaultMode, getValues, setValue]);

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
    if (!isValidZipFormat(values.zip) || zipLookupFailed) return null;
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
        entranceFeeType: destination.entrance_fee_type,
        flightPricePerPerson:
          Number.isFinite(flightPrice as number) ? (flightPrice as number) : null,
        hasGear: Boolean(values.hasGear),
        needsFerry: Boolean(drive?.needsFerry),
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
    zipLookupFailed,
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

  const landmark = destination ? landmarkForSlug(destination.slug) : null;
  const shareHref =
    budget && destination
      ? buildWhatsAppShareLink(
          budgetShareText(budget, destination.title, `${window.location.origin}/calculadora`),
        )
      : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Dark band behind the navbar (hasHero for /calculadora): the
            chosen park rises in and the travelers walk toward it (ADR-061). */}
        <PageHeader
          eyebrow="Herramienta gratis"
          title="Calculadora de presupuesto"
          subtitle="Números honestos para tu viaje a un parque nacional: gasolina, entrada oficial del NPS, hospedaje y comida."
        >
          <CalculatorScene landmark={landmark} people={Number(values.people) || 1} />
        </PageHeader>

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
              {!errors.zip && zipLookupFailed && (
                <p className="text-sm text-destructive">No encontramos ese código postal</p>
              )}
            </div>

            {/* 3 People — one hiker per traveler */}
            <div className="space-y-2">
              <Label htmlFor="people-count">¿Cuántos viajan?</Label>
              <Controller
                name="people"
                control={control}
                render={({ field }) => (
                  <PeopleStepper
                    id="people-count"
                    value={Number(field.value) || 1}
                    onChange={(next) => field.onChange(next)}
                  />
                )}
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

          {budget && destination && landmark && (
            <div className="mt-10">
              <BudgetPass
                budget={budget}
                parkTitle={destination.title}
                landmark={landmark}
                driving={effectiveTransport === "driving"}
              />

              <div className="mt-5 flex flex-col gap-3">
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
                {shareHref && (
                  <Button asChild variant="outline" size="lg" className="w-full">
                    <a
                      href={shareHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackEvent("calculator_whatsapp_share", { destination: destination.slug })
                      }
                    >
                      <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
                      Mándaselo a tu familia por WhatsApp
                    </a>
                  </Button>
                )}
                <Button asChild variant="ghost" size="lg" className="w-full">
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
