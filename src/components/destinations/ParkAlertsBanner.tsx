import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParkAlert } from "@/hooks/use-park-live-data";

interface ParkAlertsBannerProps {
  alerts: ParkAlert[];
}

const CATEGORY_ORDER: Record<string, number> = {
  Danger: 0,
  Closure: 1,
  Caution: 2,
  Information: 3,
};

const CATEGORY_LABEL: Record<string, string> = {
  Danger: "Peligro",
  Closure: "Cierre",
  Caution: "Precaución",
  Information: "Información",
};

const CATEGORY_STYLE: Record<string, string> = {
  Danger:      "bg-red-600 text-white",
  Closure:     "bg-orange-600 text-white",
  Caution:     "bg-[#D97706] text-white",
  Information: "bg-[#166534] text-white",
};

function sortAlerts(alerts: ParkAlert[]): ParkAlert[] {
  return [...alerts].sort((a, b) => {
    const oa = CATEGORY_ORDER[a.category] ?? 9;
    const ob = CATEGORY_ORDER[b.category] ?? 9;
    return oa - ob;
  });
}

export default function ParkAlertsBanner({ alerts }: ParkAlertsBannerProps) {
  const [open, setOpen] = useState(false);

  if (!alerts.length) return null;

  const sorted = sortAlerts(alerts);
  const hasDanger = alerts.some((a) => a.category === "Danger" || a.category === "Closure");

  return (
    <div
      className={cn(
        "border-b border-border",
        hasDanger ? "bg-red-50" : "bg-amber-50",
      )}
    >
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Collapsed header — always visible */}
        <button
          onClick={() => setOpen((p) => !p)}
          className="w-full flex items-center gap-3 py-4 text-left"
          aria-expanded={open}
        >
          <AlertTriangle
            className={cn(
              "h-5 w-5 shrink-0",
              hasDanger ? "text-red-600" : "text-[#D97706]",
            )}
          />
          <span
            className={cn(
              "font-sans font-semibold flex-1",
              hasDanger ? "text-red-900" : "text-amber-900",
            )}
            style={{ fontSize: 15 }}
          >
            {alerts.length === 1
              ? "1 alerta en este parque"
              : `${alerts.length} alertas en este parque`}
          </span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-[#D97706] shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#D97706] shrink-0" />
          )}
        </button>

        {/* Expanded list */}
        {open && (
          <div className="pb-4 space-y-4">
            {sorted.map((alert, i) => {
              const badgeStyle = CATEGORY_STYLE[alert.category] ?? CATEGORY_STYLE.Information;
              const label = CATEGORY_LABEL[alert.category] ?? alert.category;

              return (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-border p-4 space-y-2"
                >
                  {/* Category badge */}
                  <span
                    className={cn(
                      "inline-block font-sans font-medium rounded-full px-2.5 py-0.5",
                      badgeStyle,
                    )}
                    style={{ fontSize: 12 }}
                  >
                    {label}
                  </span>

                  {/* Title — NPS text, not translated */}
                  <p className="font-sans font-semibold text-foreground" style={{ fontSize: 14 }}>
                    {alert.title}
                  </p>

                  {/* Description — NPS text, not translated */}
                  {alert.description?.trim() && (
                    <p className="font-sans text-muted-foreground leading-relaxed" style={{ fontSize: 13 }}>
                      {alert.description.trim()}
                    </p>
                  )}

                  {/* Official link */}
                  {alert.url?.trim() && (
                    <a
                      href={alert.url.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-sans text-[#D97706] hover:underline"
                      style={{ fontSize: 13 }}
                    >
                      Ver alerta oficial
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              );
            })}

            <p className="font-sans text-muted-foreground" style={{ fontSize: 12 }}>
              Alertas oficiales de NPS, en vivo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
