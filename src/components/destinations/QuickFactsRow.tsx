import { motion } from "framer-motion";

interface QuickFactsRowProps {
  daysNeeded?: string | null;
  budgetUsd?: number | null;
  maxElevationFt?: number | null;
  bestSeason?: string | null;
}

interface Fact {
  label: string;
  value: string;
}

export default function QuickFactsRow({ daysNeeded, budgetUsd, maxElevationFt, bestSeason }: QuickFactsRowProps) {
  const facts: Fact[] = [];
  if (daysNeeded?.trim()) facts.push({ label: "Duración", value: daysNeeded.trim() });
  if (budgetUsd != null) facts.push({ label: "Presupuesto estimado", value: `~$${budgetUsd.toLocaleString("en-US")} USD` });
  if (maxElevationFt != null) facts.push({ label: "Elevación máxima", value: `${maxElevationFt.toLocaleString("en-US")} ft` });
  if (bestSeason?.trim()) facts.push({ label: "Mejor temporada", value: bestSeason.trim() });

  if (facts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-8 border-b border-border"
    >
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {facts.map(({ label, value }) => (
            <div key={label} className="bg-accent px-5 py-4 flex flex-col gap-1">
              <span className="font-serif text-2xl leading-tight text-primary">{value}</span>
              <span className="font-sans text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
