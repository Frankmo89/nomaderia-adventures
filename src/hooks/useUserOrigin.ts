import { useCallback, useEffect, useSyncExternalStore } from "react";
import { SAN_DIEGO_ORIGIN, type Origin } from "@/lib/distance";

// Almacén en memoria compartido (sin localStorage/sessionStorage — no soportado
// en el runtime). Cualquier componente que llame useUserOrigin() lee el mismo
// origen, así que fijar la ubicación una vez actualiza toda la app.

interface OriginState {
  origin: Origin;
  isFallback: boolean;
  isLocating: boolean;
}

const FALLBACK_STATE: OriginState = {
  origin: SAN_DIEGO_ORIGIN,
  isFallback: true,
  isLocating: false,
};

let state: OriginState = FALLBACK_STATE;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function setState(patch: Partial<OriginState>) {
  state = { ...state, ...patch };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): OriginState {
  return state;
}

// Guarda para el intento automático: la geolocalización se pide UNA sola vez
// por sesión (no en cada montaje de componente).
let autoAttempted = false;

function locate() {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    setState({ isFallback: true, isLocating: false });
    return;
  }
  setState({ isLocating: true });
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setState({
        origin: { lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Tu ubicación" },
        isFallback: false,
        isLocating: false,
      });
    },
    () => {
      // Denegado / error / timeout → conservar fallback San Diego.
      setState({ isFallback: true, isLocating: false });
    },
    { timeout: 8000, maximumAge: 5 * 60 * 1000, enableHighAccuracy: false }
  );
}

export interface UseUserOrigin {
  origin: Origin;
  isFallback: boolean;
  isLocating: boolean;
  requestLocation: () => void;
  setManualOrigin: (lat: number, lng: number, label?: string) => void;
}

export function useUserOrigin(): UseUserOrigin {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const requestLocation = useCallback(() => {
    autoAttempted = true;
    locate();
  }, []);

  const setManualOrigin = useCallback((lat: number, lng: number, label?: string) => {
    autoAttempted = true;
    setState({ origin: { lat, lng, label }, isFallback: false, isLocating: false });
  }, []);

  // Intento automático único al primer montaje. Si el navegador lo bloquea o el
  // usuario deniega, el error callback mantiene el fallback de San Diego.
  useEffect(() => {
    if (autoAttempted) return;
    autoAttempted = true;
    locate();
  }, []);

  return {
    origin: snap.origin,
    isFallback: snap.isFallback,
    isLocating: snap.isLocating,
    requestLocation,
    setManualOrigin,
  };
}
