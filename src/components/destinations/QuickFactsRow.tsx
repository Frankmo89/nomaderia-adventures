import { CalendarDays, Mountain, DollarSign, Sun } from "lucide-react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface QuickFactsRowProps {
  daysNeeded?: string | null;
  budgetUsd?: number | null;
  maxElevationFt?: number | null;
  bestSeason?: string | null;
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
  bestSeason,
}: QuickFactsRowProps) {
  const facts: Fact[] = [];
  if (daysNeeded?.trim())
    facts.push({ Icon: CalendarDays, label: "DÍAS", value: daysNeeded.trim() });
  if (maxElevationFt != null)
    facts.push({
      Icon: Mountain,
      label: "ELEVACIÓN",
      value: `${maxElevationFt.toLocaleString("en-US")} ft`,
    });
  if (budgetUsd != null)
    facts.push({
      Icon: DollarSign,
      label: "PRESUPUESTO",
      value: `~$${budgetUsd.toLocaleString("en-US")}`,
    });
  if (bestSeason?.trim())
    facts.push({ Icon: Sun, label: "TEMPORADA", value: bestSeason.trim() });

  if (facts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div
        className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden"
        style={{ padding: "12px 0" }}
      >
        <div className="flex">
          {facts.map(({ Icon, label, value }, i) => (
            <div
              key={label}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 px-2 ${
                i < facts.length - 1 ? "border-r border-[#E5E7EB]" : ""
              }`}
              style={{ minHeight: 56 }}
            >
              <Icon
                className="text-[#D97706]"
                style={{ width: 18, height: 18 }}
              />
              <span
                className="font-sans font-semibold text-[#1C1917] text-center leading-tight"
                style={{ fontSize: 16 }}
              >
                {value}
              </span>
              <span
                className="font-sans text-[#6B7280] tracking-[0.06em] uppercase text-center"
                style={{ fontSize: 11 }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
