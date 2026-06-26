import { Car, Plane } from "lucide-react";
import { useUserOrigin } from "@/hooks/useUserOrigin";
import { getDistanceFromOrigin } from "@/lib/distance";
import { cn } from "@/lib/utils";

interface DistanceFromYouProps {
  latitude: number | null;
  longitude: number | null;
  className?: string;
}

/**
 * Muestra la distancia desde la ubicación del usuario (o el fallback San Diego)
 * hasta el parque. Siempre como aproximación, nunca como promesa exacta.
 * Si el parque no tiene coordenadas, no renderiza nada.
 */
export function DistanceFromYou({ latitude, longitude, className }: DistanceFromYouProps) {
  const { origin, isFallback, isLocating, requestLocation } = useUserOrigin();
  const result = getDistanceFromOrigin(origin, { latitude, longitude });

  if (!result) return null;

  return (
    <div className={cn("text-xs text-muted-foreground", className)}>
      {result.recommendFlight ? (
        <span className="inline-flex items-center gap-1 font-medium text-foreground">
          <Plane className="h-3.5 w-3.5 shrink-0" />
          Mejor en avión — {result.miles} mi en línea recta
        </span>
      ) : (
        <>
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Car className="h-3.5 w-3.5 shrink-0" />
            A ~{result.driveHoursEstimate} h en auto (aprox.)
          </span>
          <span className="block text-[11px] text-muted-foreground/80">
            {result.miles} mi desde tu ubicación
          </span>
        </>
      )}

      {isFallback && (
        <button
          type="button"
          onClick={requestLocation}
          disabled={isLocating}
          className="mt-0.5 text-[11px] text-primary hover:underline disabled:opacity-60"
        >
          · desde San Diego — {isLocating ? "ubicando…" : "usar mi ubicación"}
        </button>
      )}
    </div>
  );
}

export default DistanceFromYou;
