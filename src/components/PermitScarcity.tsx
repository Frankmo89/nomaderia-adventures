import { AlertTriangle } from "lucide-react";

interface PermitScarcityProps {
  destinationSlug: string;
}

interface PermitInfo {
  mechanism: string;
  fact: string;
  window: string;
}

// TODO: Migrar este mapa a un campo jsonb 'permit_info' en la tabla 'destinations' de Supabase
// para que el contenido sea editable desde el panel admin.
const PERMIT_FACTS: Record<string, PermitInfo> = {
  "yosemite-valley": {
    mechanism: "Lotería (Half Dome) + reservas con cupo limitado",
    fact: "Miles de personas solicitan el permiso de Half Dome cada temporada para unos cientos de lugares diarios.",
    window: "La preventa de permisos abre meses antes — perder la fecha = esperar un año",
  },
  "gran-canon": {
    mechanism: "Permisos de corredor por sorteo mensual",
    fact: "Los permisos del corredor (Bright Angel / Phantom Ranch) se agotan apenas se abren.",
    window: "Sorteo mensual con fecha límite estricta",
  },
};

/**
 * PermitScarcity — muestra información real de escasez de permisos/reservas
 * SOLO para destinos que usan sistemas de lotería o reserva (parques nacionales).
 * Para destinos sin sistema de permisos (hikes locales, San Diego, etc.)
 * el componente retorna null.
 */
const PermitScarcity = ({ destinationSlug }: PermitScarcityProps) => {
  const info = PERMIT_FACTS[destinationSlug];

  // Solo mostrar para parques con sistema de permisos/reservas
  if (!info) return null;

  return (
    <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-secondary">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span className="font-semibold text-sm uppercase tracking-wide">
          {info.mechanism}
        </span>
      </div>

      <p className="text-sm text-foreground/80 leading-relaxed">
        {info.fact}
      </p>

      <p className="text-sm font-medium text-primary bg-primary/10 rounded-md px-3 py-2">
        ⏰ {info.window}
      </p>

      <p className="text-[11px] text-muted-foreground italic">
        Datos públicos de NPS / Recreation.gov.
      </p>
    </div>
  );
};

export default PermitScarcity;
