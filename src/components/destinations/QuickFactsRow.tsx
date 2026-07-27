import { CalendarDays, Mountain, DollarSign, Sun, Ticket } from "lucide-react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickFactsRowProps {
  daysNeeded?: string | null;
  budgetUsd?: number | null;
  maxElevationFt?: number | null;
  seasonShort?: string | null;
  entranceFeeUsd?: number | null;
}

interface Fact {
  Icon: LucideIcon;
  label: string;
  value: string;
}

export default function QuickFactsRow({
  daysNeeded,
  budgetUsd,
  maxElevationFt,
  seasonShort,
  entranceFeeUsd,
}: QuickFactsRowProps) {
  const facts: Fact[] = [];
  if (daysNeeded?.trim())
    facts.push({ Icon: CalendarDays, label: "DÍAS", value: daysNeeded.trim() });
  if (maxElevationFt != null)
    facts.push({
      Icon: Mountain,
      label: "ELEV. MÁXIMA",
      value: `${maxElevationFt.toLocaleString("en-US")} ft`,
    });
  if (budgetUsd != null)
    facts.push({
      Icon: DollarSign,
      label: "PRESUPUESTO",
      value: `~$${budgetUsd.toLocaleString("en-US")}`,
    });
  if (seasonShort?.trim())
    facts.push({ Icon: Sun, label: "TEMPORADA", value: seasonShort.trim() });
  if (entranceFeeUsd != null)
    facts.push({
      Icon: Ticket,
      label: "ENTRADA",
      value: entranceFeeUsd === 0 ? "Gratis" : `$${Math.round(entranceFeeUsd)}`,
    });

  const n = facts.length;
  if (n === 0) return null;

  // Uniform 2-col grid on mobile (odd count's last cell spans full width),
  // single row on desktop — border math works for any count so the row still
  // reads clean whether 3, 4 or 5 facts are present.
  const desktopCols =
    n === 5 ? "sm:grid-cols-5" :
    n === 4 ? "sm:grid-cols-4" :
    n === 3 ? "sm:grid-cols-3" :
    n === 2 ? "sm:grid-cols-2" : "sm:grid-cols-1";
  const lastRow = Math.floor((n - 1) / 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="bg-white border border-stone rounded-xl overflow-hidden">
        <div className={cn("grid grid-cols-2", desktopCols)}>
          {facts.map(({ Icon, label, value }, i) => {
            const isSpanning = n % 2 === 1 && i === n - 1;
            const hasRightNeighbor = i % 2 === 0 && i + 1 < n;
            const hasNextRow = Math.floor(i / 2) < lastRow;
            return (
              <div
                key={label}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-2 text-center border-stone",
                  isSpanning ? "col-span-2 sm:col-span-1" : "col-span-1",
                  hasRightNeighbor && "border-r",
                  hasNextRow && "border-b",
                  "sm:border-b-0",
                  i < n - 1 && "sm:border-r",
                )}
                style={{ minHeight: 76, padding: "14px 8px" }}
              >
                <Icon className="text-green" style={{ width: 18, height: 18 }} />
                <span className="font-sans font-semibold text-ink leading-tight text-[15px]">
                  {value}
                </span>
                <span className="font-condensed text-sage tracking-[0.08em] uppercase text-[11px] leading-none">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
