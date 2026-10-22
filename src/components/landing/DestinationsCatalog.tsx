import { useId, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Car, Footprints, Sun, Ticket, type LucideIcon } from "lucide-react";
import Reveal from "@/components/editorial/Reveal";
import { CardImage } from "@/components/shared/CardImage";
import { useLandingParks, type LandingPark } from "@/hooks/use-destinations";
import { formatRegionDisplay } from "@/lib/regions";
import { resizedImageUrl } from "@/lib/resized-image";
import {
  daysLabel,
  entranceFeeLabel,
  firstEasyTrail,
  parkShortName,
  parseDriveFromSanDiego,
  shortBestSeason,
  sortByDriveFromSanDiego,
} from "@/lib/landing-parks";
import { cn } from "@/lib/utils";

/**
 * Landing parks section — "Ruta + vidrio" (ADR-040).
 * Parks sit on a dashed route out of San Diego, nearest first. Phone: a
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
  trail: string | null;
}

function toRouteStop(park: LandingPark): RouteStop | null {
  const drive = parseDriveFromSanDiego(park.drive_time_from_san_diego);
  if (!drive) return null;
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
    trail: firstEasyTrail(park.signature_hikes),
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
            {stop.facts.length > 0 && (
              <ul className="flex flex-wrap gap-x-5 gap-y-2.5">
                {stop.facts.map(({ icon: Icon, text, wide }) => (
                  <li
                    key={text}
                    className={cn(
                      "flex items-center gap-2 text-sm font-semibold lg:text-[0.9375rem]",
                      wide ? "basis-full" : "whitespace-nowrap",
                    )}
                  >
                    <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                    {text}
                  </li>
                ))}
              </ul>
            )}

            {stop.trail && (
              <p className="flex items-start gap-2 border-t border-cloud/20 pt-3 text-sm leading-5 lg:text-[0.9375rem] lg:leading-[1.375rem]">
                <Footprints aria-hidden="true" className="mt-px h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                <span>
                  <span className="font-semibold">Primer sendero:</span> {stop.trail}
                </span>
              </p>
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

const Heading = () => (
  <Reveal className="mb-[22px] max-w-2xl lg:mb-7">
    <p className="font-condensed text-[0.8125rem] font-semibold uppercase leading-tight tracking-[0.08em] text-cloud/80 lg:text-sm">
      Desde San Diego
    </p>
    <h2 className="mt-3 font-condensed text-[2.125rem] font-semibold leading-[1.12] text-cloud md:text-5xl xl:text-[3.25rem] xl:leading-[1.08]">
      ¿A cuántas horas está tu próximo parque?
    </h2>
    <p className="mt-3 text-base text-cloud/80 lg:text-lg">
      <span className="lg:hidden">Desliza por la ruta: cada parque está más lejos que el anterior.</span>
      <span className="hidden lg:inline">Sigue la ruta: cada parque está más lejos que el anterior.</span>
    </p>
  </Reveal>
);

interface DestinationsCatalogProps {
  /** How many parks the route shows (Index passes 3). */
  limit?: number;
}

const DestinationsCatalog = ({ limit = 3 }: DestinationsCatalogProps) => {
  const { data: parks = [], isLoading, error } = useLandingParks();

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

  const stops = sortByDriveFromSanDiego(parks)
    .map(toRouteStop)
    .filter((s): s is RouteStop => s !== null)
    .slice(0, limit);
  const total = parks.length;

  return (
    <SectionShell>
      <Heading />

      {stops.length > 0 && (
        <Reveal delay={0.1}>
          {/* Phone: the track scrolls sideways and bleeds to the screen edge. */}
          <div className="-mx-5 snap-x snap-mandatory overflow-x-auto scroll-px-5 pb-2 [scrollbar-color:rgba(251,250,247,0.3)_transparent] lg:mx-0 lg:overflow-visible lg:pb-0">
            <div className="relative w-max px-5 lg:w-full lg:px-0">
              {/* The route: dashed line, San Diego at the start. */}
              <div aria-hidden="true" className="pointer-events-none absolute left-[30px] right-5 top-[11px] border-t-2 border-dashed border-cloud/35 lg:left-[11px] lg:right-[11px]" />
              <div aria-hidden="true" className="absolute left-5 top-0 flex snap-start flex-col items-start gap-2 lg:left-0">
                <span className={cn(NODE, "h-[22px] w-[22px] bg-cloud")} />
                <span className={ROUTE_LABEL}>San Diego</span>
              </div>
              <div aria-hidden="true" className="absolute right-0 top-0 hidden flex-col items-end gap-2 lg:flex">
                <span className={cn(NODE, "h-[22px] w-[22px] border-[3px] border-cloud bg-green")} />
                <span className={ROUTE_LABEL}>{total} parques</span>
              </div>

              <ol
                aria-label="Parques ordenados por distancia en carro desde San Diego"
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
