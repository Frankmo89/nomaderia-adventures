import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Car, Loader2, MapPin, Star, Sun, Ticket, type LucideIcon } from "lucide-react";
import Reveal from "@/components/editorial/Reveal";
import { CardImage } from "@/components/shared/CardImage";
import { Input } from "@/components/ui/input";
import { useLandingParks, type LandingPark } from "@/hooks/use-destinations";
import { trackEvent } from "@/lib/analytics";
import { logEvent } from "@/lib/events";
import { formatRegionDisplay } from "@/lib/regions";
import { resizedImageUrl } from "@/lib/resized-image";
import { daysLabel, entranceFeeLabel, highlightLine, parkShortName, shortBestSeason } from "@/lib/landing-parks";
import {
  SAN_DIEGO_ORIGIN,
  isOffRouteZip,
  isSanDiegoArea,
  originFromZip,
  readSavedOrigin,
  routeFrom,
  saveOrigin,
  type DriveFromOrigin,
  type RouteOrigin,
} from "@/lib/landing-origin";
import { isValidZipFormat, lookupZip, preloadZipTable } from "@/lib/zip-centroids";
import { cn } from "@/lib/utils";

/**
 * Landing parks section — "Ruta + vidrio" (ADR-040).
 * Parks sit on a dashed route out of San Diego, nearest first. A visitor
 * can start the route from their own ZIP instead (ADR-041). Phone: a
 * horizontal snap carousel. Desktop (lg): three columns under one route.
 * Each card is a photo with a frosted panel; the panel is opaque enough
 * that white text passes AA even over a white photo, and it falls back to
 * a near-solid panel where backdrop-filter is not supported.
 * Fogata (#D97706) stays out: it belongs to the Hero only.
 */

const LEVEL_LABEL: Record<string, string> = {
  easy: "Fácil",
  moderate: "Moderado",
  challenging: "Desafiante",
};

// Glass surfaces. Base = no backdrop-filter support (near-solid).
const GLASS_PANEL =
  "border border-cloud/20 bg-forest-dark/85 supports-[backdrop-filter]:bg-forest-dark/70 supports-[backdrop-filter]:backdrop-blur-lg";
const GLASS_PILL =
  "border border-cloud/25 bg-forest-dark/85 supports-[backdrop-filter]:bg-forest-dark/65 supports-[backdrop-filter]:backdrop-blur-md";

const NODE = "block shrink-0 rounded-full";
const ROUTE_LABEL = "font-condensed text-[0.6875rem] font-semibold uppercase leading-none tracking-[0.08em] text-cloud lg:text-[0.8125rem]";

interface RouteStop {
  park: LandingPark;
  name: string;
  drive: string;
  state: string;
  level: string | null;
  facts: { icon: LucideIcon; text: string; wide?: boolean }[];
  highlight: string | null;
}

function toRouteStop(park: LandingPark, drive: DriveFromOrigin): RouteStop {
  const days = daysLabel(park.days_needed);
  const fee = entranceFeeLabel(park.entrance_fee_usd, park.entrance_fee_type);
  const season = shortBestSeason(park.best_season);
  const facts: RouteStop["facts"] = [];
  if (days) facts.push({ icon: CalendarDays, text: days });
  if (fee) facts.push({ icon: Ticket, text: fee });
  if (season) facts.push({ icon: Sun, text: `Mejor época: ${season}`, wide: true });
  return {
    park,
    name: parkShortName(park.title),
    drive: drive.label,
    state: formatRegionDisplay(park.region),
    level: LEVEL_LABEL[park.difficulty_level] ?? null,
    facts,
    highlight: highlightLine(park.signature_experience),
  };
}

const ParkStop = ({ stop }: { stop: RouteStop }) => {
  const ctaId = useId();
  const detailsId = useId();
  const { park } = stop;

  return (
    <li className="flex w-[min(300px,calc(100vw-96px))] flex-none snap-start flex-col gap-3 lg:w-auto lg:gap-7">
      {/* Route stop: node + drive time. The pill hides the dashed line behind it. */}
      <div className="flex h-6 items-center gap-2.5 lg:h-16 lg:flex-col lg:justify-start lg:gap-1.5 lg:pt-0.5">
        <span aria-hidden="true" className={cn(NODE, "h-[18px] w-[18px] border-[3px] border-cloud bg-green")} />
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-forest-dark px-2.5 py-0.5 font-condensed text-lg font-semibold leading-6 text-cloud">
          <Car aria-hidden="true" className="h-[18px] w-[18px] lg:hidden" strokeWidth={2} />
          {stop.drive}
          <span className="font-sans text-[0.8125rem] font-normal text-cloud/80 lg:text-sm">en carro</span>
        </span>
      </div>

      <Link
        to={`/destinos/${park.slug}`}
        aria-labelledby={ctaId}
        aria-describedby={detailsId}
        className="group relative block h-[500px] overflow-hidden rounded-3xl bg-spruce outline-none focus-visible:ring-2 focus-visible:ring-cloud focus-visible:ring-offset-4 focus-visible:ring-offset-forest-dark lg:h-[540px]"
      >
        <CardImage
          src={park.hero_image_url ? resizedImageUrl(park.hero_image_url, 720) : undefined}
          alt=""
          loading="lazy"
          decoding="async"
          width={720}
          height={1200}
          className="absolute inset-0 h-full w-full object-cover object-[center_30%] transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04]"
        />

        {stop.level && (
          <span className={cn(GLASS_PILL, "absolute left-3.5 top-3.5 rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold text-cloud lg:left-4 lg:top-4 lg:text-sm")}>
            {stop.level}
          </span>
        )}

        <div className={cn(GLASS_PANEL, "absolute inset-x-2.5 bottom-2.5 flex flex-col gap-3.5 rounded-[18px] p-4 text-cloud lg:inset-x-3 lg:bottom-3 lg:p-[18px]")}>
          <div>
            <h3 className="font-condensed text-[2rem] font-semibold uppercase leading-[1.06] xl:text-[2.375rem]">{stop.name}</h3>
            {stop.state && <p className="mt-0.5 text-sm text-cloud/90 lg:text-[0.9375rem]">{stop.state}</p>}
          </div>

          <div id={detailsId} className="flex flex-col gap-3.5">
            {/* Under 380 px (common Android widths) the type and icons step down so
                days and fee share a row and the photo stays visible. */}
            {stop.facts.length > 0 && (
              <ul className="flex flex-wrap gap-x-3 gap-y-2.5 min-[380px]:gap-x-5">
                {stop.facts.map(({ icon: Icon, text, wide }) => (
                  <li
                    key={text}
                    className={cn(
                      "flex items-center gap-1.5 text-[0.8125rem] font-semibold min-[380px]:gap-2 min-[380px]:text-sm lg:text-[0.9375rem]",
                      wide ? "basis-full" : "whitespace-nowrap",
                    )}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4 shrink-0 min-[380px]:h-[18px] min-[380px]:w-[18px]" strokeWidth={2} />
                    {text}
                  </li>
                ))}
              </ul>
            )}

            {stop.highlight && (
              <div className="border-t border-cloud/20 pt-3">
                <p className="flex items-center gap-1.5 font-condensed text-[0.75rem] font-semibold uppercase leading-4 tracking-[0.08em] text-cloud/85 lg:text-[0.8125rem]">
                  <Star aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  No te pierdas
                </p>
                <p className="mt-1 text-sm leading-5 lg:text-[0.9375rem] lg:leading-[1.375rem]">{stop.highlight}</p>
              </div>
            )}
          </div>

          <span
            id={ctaId}
            className="flex min-h-[46px] items-center justify-center rounded-full bg-cloud px-4 text-[0.9375rem] font-semibold text-ink transition-colors group-hover:bg-white lg:min-h-12 lg:text-base"
          >
            {/* Narrow cards show "Ver guía →"; the park name is still in the link's name. */}
            Ver guía<span className="sr-only xl:not-sr-only">&nbsp;de {stop.name}</span>&nbsp;→
          </span>
        </div>
      </Link>
    </li>
  );
};

const SectionShell = ({ children }: { children: ReactNode }) => (
  <section id="destinos" className="relative overflow-hidden bg-forest-dark section-editorial section-recessed">
    <div className="noise-bg pointer-events-none absolute inset-0 opacity-[0.04]" />
    <div className="container relative z-10 mx-auto px-5 lg:px-8">{children}</div>
  </section>
);

const EYEBROW = "font-condensed text-[0.8125rem] font-semibold uppercase leading-tight tracking-[0.08em] text-cloud/80 lg:text-sm";

const Heading = ({ eyebrow }: { eyebrow?: ReactNode }) => (
  <Reveal className="mb-[22px] max-w-2xl lg:mb-7">
    {eyebrow ?? <p className={EYEBROW}>Desde San Diego</p>}
    <h2 className="mt-3 font-condensed text-[2.125rem] font-semibold leading-[1.12] text-cloud md:text-5xl xl:text-[3.25rem] xl:leading-[1.08]">
      ¿A cuántas horas está tu próximo parque?
    </h2>
    <p className="mt-3 text-base text-cloud/80 lg:text-lg">
      <span className="lg:hidden">Desliza por la ruta: cada parque está más lejos que el anterior.</span>
      <span className="hidden lg:inline">Sigue la ruta: cada parque está más lejos que el anterior.</span>
    </p>
  </Reveal>
);

const MSG_FORMAT = "Escribe los 5 dígitos de tu código postal.";
const MSG_OFF_ROUTE =
  "Esta ruta es para manejar dentro de los 48 estados contiguos. Desde Alaska, Hawái o un territorio, haz el quiz: te muestra parques a los que puedes volar.";
const MSG_NOT_FOUND = "No encontramos ese código postal. Revisa que sean los 5 dígitos de tu código en EE. UU.";
const MSG_NETWORK = "No pudimos validar tu código postal. Revisa tu conexión e intenta de nuevo.";

/**
 * "Desde San Diego · Cambiar": the eyebrow plus a small ZIP form. The ZIP
 * table (~570 KB, same file as the quiz) loads only when the field gets focus.
 */
const OriginControl = ({ origin, onChange }: { origin: RouteOrigin; onChange: (next: RouteOrigin) => void }) => {
  const [open, setOpen] = useState(false);
  const [zip, setZip] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const formId = useId();
  const inputId = useId();
  const messageId = useId();

  const close = () => {
    setOpen(false);
    setMessage(null);
    requestAnimationFrame(() => toggleRef.current?.focus());
  };

  const report = (zip3: string, result: "zip" | "san_diego_area" | "off_route") => {
    logEvent("landing_origin_set", { zip3, result });
    trackEvent("landing_origin_set", { zip3, result });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (checking) return;
    if (!isValidZipFormat(zip)) {
      setMessage(MSG_FORMAT);
      return;
    }
    if (isOffRouteZip(zip)) {
      setMessage(MSG_OFF_ROUTE);
      report(zip.slice(0, 3), "off_route");
      return;
    }
    setChecking(true);
    setMessage(null);
    try {
      const point = await lookupZip(zip);
      if (!point) {
        setMessage(MSG_NOT_FOUND);
        return;
      }
      const next = originFromZip(zip, point);
      onChange(next);
      report(zip.slice(0, 3), next.kind === "san-diego" ? "san_diego_area" : "zip");
      close();
    } catch {
      setMessage(MSG_NETWORK);
    } finally {
      setChecking(false);
    }
  };

  const place = origin.kind === "san-diego" ? "San Diego" : `tu código postal ${origin.zip}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className={EYEBROW}>Desde {place}</p>
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={formId}
          onClick={() => (open ? close() : setOpen(true))}
          className="relative inline-flex h-8 items-center gap-1.5 rounded-full border border-cloud/30 bg-cloud/5 px-3 text-[0.8125rem] font-semibold text-cloud transition-colors after:absolute after:-inset-y-2 after:inset-x-0 after:content-[''] hover:bg-cloud/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cloud"
        >
          <MapPin aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
          {open ? "Cerrar" : "Cambiar"}
        </button>
      </div>

      {open && (
        <form id={formId} onSubmit={submit} noValidate className="mt-4 flex flex-wrap items-center gap-2">
          <label htmlFor={inputId} className="basis-full text-sm font-medium text-cloud/90">
            Tu código postal en EE. UU.
          </label>
          <Input
            id={inputId}
            autoFocus
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            placeholder="Ej. 85004"
            value={zip}
            onFocus={preloadZipTable}
            onChange={(e) => {
              setZip(e.target.value.replace(/\D/g, "").slice(0, 5));
              setMessage(null);
            }}
            aria-invalid={message !== null && message !== MSG_OFF_ROUTE}
            aria-describedby={messageId}
            className="h-11 w-36 rounded-full border-cloud/30 bg-cloud/10 px-4 text-base tracking-widest md:text-base text-cloud placeholder:text-cloud/60 focus-visible:ring-cloud focus-visible:ring-offset-forest-dark"
          />
          <button
            type="submit"
            disabled={checking}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-cloud px-5 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-white disabled:opacity-70"
          >
            {checking && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
            Ver mi ruta
          </button>
          {origin.kind !== "san-diego" && (
            <button
              type="button"
              onClick={() => {
                onChange(SAN_DIEGO_ORIGIN);
                close();
              }}
              className="h-11 px-2 text-[0.9375rem] font-semibold text-cloud underline underline-offset-4 hover:text-white"
            >
              Volver a San Diego
            </button>
          )}
          <p id={messageId} aria-live="polite" className="min-h-5 basis-full text-sm text-cloud/85">
            {message}
          </p>
        </form>
      )}
    </div>
  );
};

/** Saved ZIP if any; a saved ZIP in the San Diego area counts as San Diego. */
function initialOrigin(): RouteOrigin {
  const saved = readSavedOrigin();
  if (!saved || saved.kind !== "zip" || isSanDiegoArea(saved)) return SAN_DIEGO_ORIGIN;
  return saved;
}

interface DestinationsCatalogProps {
  /** How many parks the route shows (Index passes 3). */
  limit?: number;
}

const DestinationsCatalog = ({ limit = 3 }: DestinationsCatalogProps) => {
  const { data: parks = [], isLoading, error } = useLandingParks();
  const [origin, setOrigin] = useState<RouteOrigin>(initialOrigin);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // A new origin is a new route: start the phone carousel from the beginning.
  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [origin]);

  const changeOrigin = (next: RouteOrigin) => {
    setOrigin(next);
    saveOrigin(next);
  };

  if (isLoading) {
    return (
      <SectionShell>
        <Heading />
        <div aria-hidden="true" className="flex gap-3.5 overflow-hidden lg:grid lg:grid-cols-3 lg:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-[min(300px,calc(100vw-96px))] flex-none pt-9 lg:w-auto lg:pt-[92px]">
              <div className="h-[500px] animate-pulse rounded-3xl bg-spruce lg:h-[540px]" />
            </div>
          ))}
        </div>
      </SectionShell>
    );
  }

  if (error) {
    return (
      <SectionShell>
        <p className="text-center text-cloud/70">No se pudieron cargar los destinos. Intenta recargar la página.</p>
      </SectionShell>
    );
  }

  const stops = routeFrom(parks, origin)
    .slice(0, limit)
    .map(({ park, drive }) => toRouteStop(park, drive));
  const total = parks.length;
  const startLabel = origin.kind === "san-diego" ? "San Diego" : origin.zip;
  const estimated = origin.kind === "zip";

  return (
    <SectionShell>
      <Heading eyebrow={<OriginControl origin={origin} onChange={changeOrigin} />} />

      {stops.length > 0 && (
        <Reveal delay={0.1}>
          {/* Phone: the track scrolls sideways and bleeds to the screen edge. */}
          <div ref={scrollerRef} className="-mx-5 snap-x snap-mandatory overflow-x-auto scroll-px-5 pb-2 [scrollbar-color:rgba(251,250,247,0.3)_transparent] lg:mx-0 lg:overflow-visible lg:pb-0">
            <div className="relative w-max px-5 lg:w-full lg:px-0">
              {/* The route: dashed line, the origin at the start. */}
              <div aria-hidden="true" className="pointer-events-none absolute left-[30px] right-5 top-[11px] border-t-2 border-dashed border-cloud/35 lg:left-[11px] lg:right-[11px]" />
              <div aria-hidden="true" className="absolute left-5 top-0 flex snap-start flex-col items-start gap-2 lg:left-0">
                <span className={cn(NODE, "h-[22px] w-[22px] bg-cloud")} />
                <span className={ROUTE_LABEL}>{startLabel}</span>
              </div>
              <div aria-hidden="true" className="absolute right-0 top-0 hidden flex-col items-end gap-2 lg:flex">
                <span className={cn(NODE, "h-[22px] w-[22px] border-[3px] border-cloud bg-green")} />
                <span className={ROUTE_LABEL}>{total} parques</span>
              </div>

              <ol
                aria-label={`Parques ordenados por distancia en carro desde ${origin.kind === "san-diego" ? "San Diego" : `el código postal ${origin.zip}`}`}
                className="relative flex gap-3.5 pl-[54px] lg:grid lg:grid-cols-3 lg:gap-6 lg:pl-0"
              >
                {stops.map((stop) => (
                  <ParkStop key={stop.park.id} stop={stop} />
                ))}

                {/* Phone only: the route keeps going. Desktop has the button below. */}
                <li className="flex w-[210px] flex-none snap-end flex-col gap-3 lg:hidden">
                  <div className="flex h-6 items-center">
                    <span aria-hidden="true" className={cn(NODE, "h-[22px] w-[22px] border-[3px] border-cloud bg-green")} />
                  </div>
                  <Link
                    to="/destinos"
                    className="flex h-[500px] flex-col justify-end gap-2.5 rounded-3xl border border-cloud/25 bg-spruce p-5 text-cloud outline-none focus-visible:ring-2 focus-visible:ring-cloud focus-visible:ring-offset-4 focus-visible:ring-offset-forest-dark"
                  >
                    <span className="font-condensed text-[1.75rem] font-semibold uppercase leading-8">
                      Sigue la ruta: {total} parques
                    </span>
                    <span className="flex min-h-[46px] items-center justify-center rounded-full bg-cloud text-[0.9375rem] font-semibold text-ink">
                      Ver todos →
                    </span>
                  </Link>
                </li>
              </ol>
            </div>
          </div>
          {estimated && (
            <p className="mt-3 max-w-2xl text-sm text-cloud/80">
              ≈ Horas estimadas en línea recta desde {startLabel}, redondeadas hacia arriba. Antes de salir, revisa la
              ruta en tu mapa.
            </p>
          )}
        </Reveal>
      )}

      <Reveal className="mt-[22px] flex flex-col gap-6 lg:mt-7 lg:flex-row lg:items-center">
        <Link
          to="/destinos"
          className="hidden min-h-[52px] items-center rounded-full border-[1.5px] border-cloud/70 px-7 text-base font-semibold text-cloud transition-colors hover:bg-cloud hover:text-ink lg:inline-flex"
        >
          Sigue la ruta: ver los {total} parques →
        </Link>
        <a
          href="#quiz"
          className="flex min-h-[52px] items-center justify-center rounded-full border-[1.5px] border-cloud/70 text-[0.9375rem] font-semibold text-cloud transition-colors hover:bg-cloud hover:text-ink lg:min-h-0 lg:rounded-none lg:border-0 lg:text-base lg:underline lg:underline-offset-4 lg:hover:bg-transparent lg:hover:text-white"
        >
          ¿No sabes cuál? Haz el quiz →
        </a>
      </Reveal>
    </SectionShell>
  );
};

export default DestinationsCatalog;
