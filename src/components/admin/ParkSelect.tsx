import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDestinationParkOptions } from "@/hooks/use-destinations";

const NONE_VALUE = "none";

interface ParkSelectProps {
  value: string | undefined;
  onChange: (destinationId: string | undefined) => void;
  className?: string;
}

/**
 * Selector de parque para el flujo de blog IA. Solo lista destinos con
 * park_code (ver useDestinationParkOptions) para que elegir un parque
 * garantice un filter_park_code real en match_knowledge_chunks.
 */
export function ParkSelect({ value, onChange, className }: ParkSelectProps) {
  const { data: parks = [] } = useDestinationParkOptions();

  return (
    <Select
      value={value ?? NONE_VALUE}
      onValueChange={(v) => onChange(v === NONE_VALUE ? undefined : v)}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Sin parque específico" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>Sin parque específico</SelectItem>
        {parks.map((park) => (
          <SelectItem key={park.id} value={park.id}>
            {park.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
