import { useMemo, type CSSProperties, type ReactNode } from "react";
import {
  Backpack,
  BedDouble,
  CalendarDays,
  Car,
  Fuel,
  Plane,
  Ship,
  Tent,
  Ticket,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { SCENE_PALETTES, sceneTileUrls } from "@/lib/park-scene-tiles";
import { landmarkUrl, type LandmarkId } from "@/lib/calculator-scene";
import { STYLE_LABELS, type BudgetCalcResult, type BudgetLine } from "@/lib/budget-calc";
import { cn } from "@/lib/utils";

// The calculator's result as a park pass (ADR-061): a night scene with the
// park's landmark on top, the costs, a tear line with notches, and the stub
// with the total and the day it was worked out. Built to look good in a
// screenshot sent to the family chat.

interface BudgetPassProps {
  budget: BudgetCalcResult;
  parkTitle: string;
  landmark: LandmarkId;
  driving: boolean;
  /** Shown on the stamp; defaults to now. */
  calculatedAt?: Date;
}

interface LineLook {
  icon: LucideIcon;
  /** Segment and icon colors (design-system tokens; no terracotta). */
  bar: string;
  chip: string;
}

const LOOK: Record<BudgetLine["id"], LineLook> = {
  gas: { icon: Fuel, bar: "bg-green", chip: "bg-green/10 text-green" },
  flights: { icon: Plane, bar: "bg-sky", chip: "bg-mist text-slate" },
  car_rental: { icon: Car, bar: "bg-green-dark", chip: "bg-green-dark/10 text-green-dark" },
  ferry: { icon: Ship, bar: "bg-sky", chip: "bg-mist text-slate" },
  entrance: { icon: Ticket, bar: "bg-sage", chip: "bg-sage/15 text-slate" },
  lodging: { icon: BedDouble, bar: "bg-forest-dark", chip: "bg-forest-dark/10 text-forest-dark" },
  food: { icon: UtensilsCrossed, bar: "bg-amber", chip: "bg-amber/15 text-slate" },
  gear: { icon: Backpack, bar: "bg-slate", chip: "bg-slate/10 text-slate" },
};

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/** "27 oct 2026" */
function stampDate(d: Date): string {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" })
    .format(d)
    .replace(/\./g, "")
    .replace(/ de /g, " ");
}

const NIGHT = SCENE_PALETTES.night;

const BudgetPass = ({ budget, parkTitle, landmark, driving, calculatedAt }: BudgetPassProps) => {
  const tiles = useMemo(() => sceneTileUrls(NIGHT), []);
  const landmarkSrc = useMemo(() => landmarkUrl(landmark, NIGHT), [landmark]);
  const date = useMemo(() => stampDate(calculatedAt ?? new Date()), [calculatedAt]);

  const lines = budget.lines.filter((l) => l.alwaysShow || l.amount > 0 || l.excludeFromTotal);
  const counted = lines.filter((l) => !l.excludeFromTotal && l.amount > 0);
  const pending = lines.filter((l) => l.excludeFromTotal).map((l) => l.label.toLowerCase());
  const [s0, s1, s2, s3, s4] = NIGHT.sky;
  const sky = {
    background: `linear-gradient(to bottom, ${s0} 0%, ${s1} 38%, ${s2} 58%, ${s3} 82%, ${s4} 100%)`,
  } as CSSProperties;

  return (
    <article
      aria-label={`Presupuesto estimado para ${parkTitle}`}
      className="relative overflow-hidden rounded-3xl border border-border bg-white shadow-[0_4px_16px_rgba(20,32,26,0.08)]"
    >
      {/* Night scene with the park's landmark */}
      <header className="relative h-44 overflow-hidden" style={sky}>
        <div aria-hidden="true" className="absolute inset-0">
          {PASS_STARS.map(([left, top]) => (
            <span
              key={`${left}-${top}`}
              className="absolute h-[2px] w-[2px] rounded-full bg-cloud opacity-60"
              style={{ left: `${left}%`, top: `${top}%` }}
            />
          ))}
          <div
            className="absolute inset-x-0 bottom-5 h-16 bg-repeat-x"
            style={{ backgroundImage: tiles.far, backgroundSize: "auto 100%", backgroundPosition: "-520px bottom" }}
          />
          <img
            src={landmarkSrc}
            alt=""
            className="calc-landmark-fade absolute bottom-3 right-5 h-[88px] w-auto max-w-[55%] object-contain object-bottom"
          />
          <div
            className="absolute inset-x-0 bottom-2 h-8 bg-repeat-x"
            style={{ backgroundImage: tiles.trees, backgroundSize: "auto 100%", backgroundPosition: "-300px bottom" }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-6 bg-repeat-x"
            style={{ backgroundImage: tiles.ridge, backgroundSize: "auto 100%" }}
          />
        </div>
        <div className="relative px-5 pt-4 pr-[40%] sm:pr-[45%]">
          <p className="font-condensed text-xs font-semibold uppercase tracking-[0.08em] text-mist/90">
            Pase de presupuesto
          </p>
          <h2 className="mt-1 font-serif text-xl font-bold leading-tight text-cloud sm:text-2xl">{parkTitle}</h2>
        </div>
      </header>

      {/* Trip details */}
      <ul className="flex flex-wrap gap-2 px-5 pt-4" aria-label="Tu viaje">
        <Chip icon={Users}>
          {budget.people} {budget.people === 1 ? "persona" : "personas"}
        </Chip>
        <Chip icon={CalendarDays}>
          {budget.days} {budget.days === 1 ? "día" : "días"}
        </Chip>
        <Chip icon={budget.style === "budget" ? Tent : BedDouble}>{STYLE_LABELS[budget.style]}</Chip>
        <Chip icon={driving ? Car : Plane}>{driving ? "Manejando" : "Volando"}</Chip>
      </ul>

      {/* Where the money goes */}
      {budget.total > 0 && (
        <div className="mx-5 mt-4 flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          {counted.map((l) => (
            <span
              key={l.id}
              className={cn("h-full border-r-2 border-white last:border-r-0", LOOK[l.id].bar)}
              style={{ width: `${(l.amount / budget.total) * 100}%` }}
            />
          ))}
        </div>
      )}

      <ul className="mt-2 divide-y divide-dashed divide-border px-5">
        {lines.map((line) => {
          const look = LOOK[line.id];
          const Icon = line.id === "lodging" && budget.style === "budget" ? Tent : look.icon;
          return (
            <li key={line.id} className="flex items-center gap-3 py-3">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", look.chip)}>
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  {line.label}
                  {line.tag && (
                    <span className="ml-2 inline-block rounded-full bg-green-wash px-2 py-0.5 align-middle font-condensed text-[10px] font-semibold uppercase tracking-[0.06em] text-green">
                      {line.tag}
                    </span>
                  )}
                </p>
                {line.subtext && <p className="mt-0.5 text-xs leading-snug text-sage">{line.subtext}</p>}
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums",
                  line.displayAmount ? "text-sage" : "text-ink",
                )}
              >
                {line.displayAmount ?? formatUsd(line.amount)}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Tear line */}
      <div className="relative mt-1 h-7" aria-hidden="true">
        <div className="absolute inset-x-6 top-1/2 border-t-2 border-dashed border-border" />
        <span className="absolute -left-3.5 top-0 h-7 w-7 rounded-full border border-border bg-background shadow-[inset_0_1px_3px_rgba(20,32,26,0.12)]" />
        <span className="absolute -right-3.5 top-0 h-7 w-7 rounded-full border border-border bg-background shadow-[inset_0_1px_3px_rgba(20,32,26,0.12)]" />
      </div>

      {/* Stub */}
      <div className="flex items-end justify-between gap-4 px-5 pb-4 pt-1">
        <div className="min-w-0">
          <p className="font-condensed text-xs font-semibold uppercase tracking-[0.08em] text-sage">Total estimado</p>
          <p className="font-serif text-4xl font-bold leading-none text-ink tabular-nums">
            {formatUsd(budget.total)}
          </p>
          <p className="mt-1.5 text-sm text-slate">
            <span className="whitespace-nowrap">≈ {formatUsd(budget.perPerson)} por persona</span>
            {pending.length > 0 && <span className="block text-sage">+ {pending.join(" y ")}</span>}
          </p>
        </div>
        <div
          className="shrink-0 -rotate-6 rounded-lg border-2 border-green/70 px-2.5 py-1.5 text-center font-condensed uppercase leading-tight text-green"
          aria-label={`Calculado el ${date}`}
        >
          <span className="block text-[10px] font-semibold tracking-[0.1em]">Calculado</span>
          <span className="block text-xs font-bold tracking-[0.06em]">{date}</span>
        </div>
      </div>
      <p className="px-5 pb-5 text-xs leading-relaxed text-sage">
        La entrada es dato oficial del NPS. Gasolina, hospedaje y comida son estimados; tu itinerario trae precios
        exactos.
      </p>
    </article>
  );
};

const Chip = ({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) => (
  <li className="inline-flex items-center gap-1.5 rounded-full bg-green-wash px-3 py-1 text-xs font-medium text-ink">
    <Icon className="h-3.5 w-3.5 text-green" aria-hidden />
    {children}
  </li>
);

/** Stars in the pass sky as [left %, top %], kept off the title (left half, top rows). */
const PASS_STARS: ReadonlyArray<readonly [number, number]> = [
  [64, 12], [72, 30], [81, 9], [90, 22], [96, 40], [58, 34], [86, 48], [6, 72], [30, 64], [46, 58],
];

export default BudgetPass;
