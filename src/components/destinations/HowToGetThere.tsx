import ReactMarkdown from "react-markdown";
import { Plane, Car, Signal, Tent, Hotel, MapPin, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LodgingOption {
  nombre?: string;
  tipo?: string;
  rango_precio_usd?: string;
  reserva_url?: string;
  notas?: string;
}

interface HowToGetThereProps {
  nearestAirport?: string | null;
  nearestTown?: string | null;
  driveTimeFromLA?: string | null;
  driveTimeFromSD?: string | null;
  gettingThereMarkdown?: string | null;
  cellSignalStatus?: string | null;
  lodgingInfo?: LodgingOption[] | null;
  latitude?: number | null;
  longitude?: number | null;
}

function InfoRow({
  Icon,
  label,
  value,
  last,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div className={cn("flex items-start gap-3 px-4 py-3 bg-accent/30", !last && "border-b border-border")}>
      <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-sans uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm text-foreground font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function HowToGetThere({
  nearestAirport,
  nearestTown,
  driveTimeFromLA,
  driveTimeFromSD,
  gettingThereMarkdown,
  cellSignalStatus,
  lodgingInfo,
  latitude,
  longitude,
}: HowToGetThereProps) {
  const hasMap = latitude != null && longitude != null;
  const mapSrc = hasMap
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude! - 0.3},${latitude! - 0.3},${longitude! + 0.3},${latitude! + 0.3}&layer=mapnik&marker=${latitude},${longitude}`
    : null;

  const rows: Array<{ Icon: LucideIcon; label: string; value: string }> = [];
  if (nearestAirport?.trim()) rows.push({ Icon: Plane,  label: "Aeropuerto más cercano", value: nearestAirport });
  if (nearestTown?.trim())    rows.push({ Icon: MapPin, label: "Ciudad base",             value: nearestTown });
  if (driveTimeFromLA?.trim()) rows.push({ Icon: Car,   label: "Desde Los Ángeles",       value: driveTimeFromLA });
  if (driveTimeFromSD?.trim()) rows.push({ Icon: Car,   label: "Desde San Diego",         value: driveTimeFromSD });
  if (cellSignalStatus?.trim()) rows.push({ Icon: Signal, label: "Señal celular",         value: cellSignalStatus });

  const lodging = lodgingInfo?.filter((l) => l.nombre?.trim()) ?? [];

  if (!hasMap && rows.length === 0 && !gettingThereMarkdown && lodging.length === 0) return null;

  return (
    <div className="space-y-8">
      {/* Mapa de ubicación — OpenStreetMap, sin clave de API */}
      {mapSrc && (
        <div className="rounded-xl overflow-hidden border border-border">
          <iframe
            src={mapSrc}
            title="Ubicación del destino"
            loading="lazy"
            className="w-full h-52 md:h-64"
            style={{ border: 0 }}
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Filas de acceso */}
      {rows.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          {rows.map(({ Icon, label, value }, i) => (
            <InfoRow key={label} Icon={Icon} label={label} value={value} last={i === rows.length - 1} />
          ))}
        </div>
      )}

      {/* Prosa "Cómo llegar" generada por IA */}
      {gettingThereMarkdown && (
        <div className="prose prose-stone max-w-none text-foreground/90">
          <ReactMarkdown>{gettingThereMarkdown}</ReactMarkdown>
        </div>
      )}

      {/* Hospedaje */}
      {lodging.length > 0 && (
        <div>
          <h4 className="font-serif text-xl text-foreground mb-4">Hospedaje</h4>
          <div className="space-y-3">
            {lodging.map((l, i) => {
              const isCamping = l.tipo?.toLowerCase().includes("camp");
              const LodgingIcon = isCamping ? Tent : Hotel;
              return (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                  <LodgingIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {l.nombre && (
                        <span className="font-medium text-foreground text-sm">{l.nombre}</span>
                      )}
                      {l.tipo && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground border border-border">
                          {l.tipo}
                        </span>
                      )}
                      {l.rango_precio_usd && (
                        <span className="text-xs font-semibold text-primary">{l.rango_precio_usd}</span>
                      )}
                    </div>
                    {l.notas && (
                      <p className="text-sm text-muted-foreground leading-snug">{l.notas}</p>
                    )}
                    {l.reserva_url && (
                      <a
                        href={l.reserva_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-xs text-primary hover:underline"
                      >
                        Ver opciones →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
