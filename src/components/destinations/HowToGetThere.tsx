import ReactMarkdown from "react-markdown";
import { Plane, Car, Signal, MapPin, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LodgingOption {
  nombre?: string;
  tipo?: string;
  // v2 shape (ingest-park-permits — numeric price)
  precio_usd?: number | null;
  precio_nota?: string | null;
  dentro_del_parque?: boolean;
  // v1 shape (generate-park-content — string range)
  rango_precio_usd?: string;
  notas?: string;
  reserva_url?: string;
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

function LodgingCard({
  lodging: l,
  fullWidth = false,
}: {
  lodging: LodgingOption;
  fullWidth?: boolean;
}) {
  const priceDisplay = l.precio_usd != null
    ? `Desde $${l.precio_usd}/noche`
    : l.rango_precio_usd
    ? l.rango_precio_usd
    : null;
  const note = l.precio_nota ?? l.notas ?? null;

  return (
    <div
      className="bg-white rounded-xl shrink-0 flex flex-col"
      style={{
        width:     fullWidth ? "100%" : 280,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        padding:   "10px 12px",
      }}
    >
      {/* Type badge */}
      {l.tipo && (
        <span
          className="font-sans self-start mb-2"
          style={{
            background:   "#F3F4F6",
            border:       "1px solid #E5E7EB",
            borderRadius: 999,
            padding:      "3px 10px",
            fontSize:     12,
            color:        "#4B5563",
          }}
        >
          {l.tipo}
          {l.dentro_del_parque != null && (
            <> · {l.dentro_del_parque ? "Dentro del parque" : "Fuera del parque"}</>
          )}
        </span>
      )}

      {/* Name */}
      {l.nombre && (
        <span
          className="font-sans font-semibold text-[#1C1917] leading-snug"
          style={{ fontSize: 15 }}
        >
          {l.nombre}
        </span>
      )}

      {/* Note */}
      {note && (
        <p
          className="font-sans text-[#6B7280] mt-1 line-clamp-2"
          style={{ fontSize: 12, lineHeight: 1.45 }}
        >
          {note}
        </p>
      )}

      <div style={{ height: 8 }} />

      {/* Price + link row */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        {priceDisplay && (
          <span
            className="font-sans text-[#1C1917]"
            style={{ fontSize: 14 }}
          >
            {priceDisplay}
          </span>
        )}
        {l.reserva_url && (
          <a
            href={l.reserva_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-green hover:text-green-dark hover:underline shrink-0 ml-auto"
            style={{ fontSize: 13 }}
          >
            Ver opciones →
          </a>
        )}
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

          {lodging.length === 1 ? (
            // Single entry → full-width card
            <LodgingCard lodging={lodging[0]} fullWidth />
          ) : (
            // Multiple entries → horizontal scroll
            <div className="relative">
              <div
                className="flex overflow-x-auto gap-3 scrollbar-hide"
                style={{ paddingLeft: 0, paddingRight: 28 }}
              >
                {lodging.slice(0, 3).map((l, i) => (
                  <LodgingCard key={i} lodging={l} />
                ))}
              </div>
              {/* Right fade mask */}
              <div
                className="absolute right-0 top-0 h-full pointer-events-none"
                style={{
                  width: 28,
                  background: "linear-gradient(to left, #FAFAFA 0px, transparent 28px)",
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
