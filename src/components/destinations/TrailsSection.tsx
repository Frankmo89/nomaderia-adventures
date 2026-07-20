import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import TrailCards, { type SignatureHike } from "@/components/destinations/TrailCards";
import { cn } from "@/lib/utils";

interface TrailsSectionProps {
  hikes: SignatureHike[];
  /** Coordenadas del parque (destinations.latitude/longitude) — encuadran el
   * mapa a escala de parque antes de ajustar a los pines de senderos. */
  parkLat?: number | null;
  parkLng?: number | null;
}

// Medio-lado del cuadro "escala de parque" alrededor del centro del parque,
// en grados (~0.15° ≈ escala regional/parque típica). No varía por tamaño de
// parque real (no tenemos polígono de límites, solo un punto) — es un
// mínimo razonable, no una medida exacta.
const PARK_FRAME_DEGREES = 0.15;
// Tope duro de zoom para fitBounds: nunca se acerca más que esto aunque los
// pines sincronizados (o el cuadro de parque) sean diminutos.
const MAX_MAP_ZOOM = 11;

type FilterKey = "all" | "principiante" | "ninos";

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "Todas",
  principiante: "Para principiantes",
  ninos: "Aptas para niños",
};

// Trail Green pin — avoids Leaflet's default marker which breaks under Vite's asset pipeline
const greenIcon = L.divIcon({
  className: "",
  html: `<div class="bg-green" style="width:22px;height:22px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -14],
});

export default function TrailsSection({ hikes, parkLat, parkLng }: TrailsSectionProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const hikesWithCoords = useMemo(
    () => hikes.filter((h) => h.trailhead_lat != null && h.trailhead_lng != null),
    [hikes],
  );

  const hasNinos = useMemo(() => hikes.some((h) => h.apto_ninos === true), [hikes]);

  const filteredHikes = useMemo(() => {
    if (activeFilter === "principiante") return hikes.filter((h) => h.apto_principiante === true);
    if (activeFilter === "ninos") return hikes.filter((h) => h.apto_ninos === true);
    return hikes;
  }, [hikes, activeFilter]);

  // Fallback pre-2026-07-20: promedio de los pines sincronizados a zoom fijo.
  // Con pocos senderos sincronizados (rotación por batch) esto centraba el
  // mapa en la esquina donde cayeron esos pines, no en el parque — se lee
  // como un zoom absurdo aunque el número de zoom nunca cambiara. Se
  // mantiene solo para parques sin destinations.latitude/longitude.
  const mapCenter = useMemo(() => {
    if (!hikesWithCoords.length) return null;
    const lat = hikesWithCoords.reduce((s, h) => s + h.trailhead_lat!, 0) / hikesWithCoords.length;
    const lng = hikesWithCoords.reduce((s, h) => s + h.trailhead_lng!, 0) / hikesWithCoords.length;
    return [lat, lng] as [number, number];
  }, [hikesWithCoords]);

  // Encuadre a escala de parque: arranca de un cuadro fijo alrededor del
  // centro del parque y lo extiende (nunca lo encoge) con cada pin de
  // sendero — así 1-2 pines sincronizados nunca fuerzan un acercamiento
  // mayor que "el parque completo" (maxZoom lo garantiza como tope duro).
  const mapBounds = useMemo(() => {
    if (parkLat == null || parkLng == null || !hikesWithCoords.length) return null;
    const bounds = L.latLngBounds(
      [parkLat - PARK_FRAME_DEGREES, parkLng - PARK_FRAME_DEGREES],
      [parkLat + PARK_FRAME_DEGREES, parkLng + PARK_FRAME_DEGREES],
    );
    hikesWithCoords.forEach((h) => bounds.extend([h.trailhead_lat!, h.trailhead_lng!]));
    return bounds;
  }, [parkLat, parkLng, hikesWithCoords]);

  if (!hikes.length) return null;

  const visibleFilters: FilterKey[] = hasNinos
    ? ["all", "principiante", "ninos"]
    : ["all", "principiante"];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-14 border-b border-border"
    >
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Senderos</h2>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {visibleFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "font-sans text-sm px-4 py-1.5 rounded-full border transition-colors",
                activeFilter === f
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-foreground border-border hover:border-primary/60 hover:text-primary",
              )}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Map — only rendered when at least one hike has coordinates. Framed
            at park scale (mapBounds) when destinations.latitude/longitude is
            available; falls back to the pin-average/fixed-zoom behavior
            otherwise (parks with no coordinates on file). */}
        {mapCenter && (
          <div
            className="rounded-xl overflow-hidden mb-8 border border-border"
            style={{ height: 280 }}
          >
            {mapBounds ? (
              <MapContainer
                bounds={mapBounds}
                boundsOptions={{ padding: [24, 24], maxZoom: MAX_MAP_ZOOM }}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {hikesWithCoords.map((h, i) => (
                  <Marker key={i} position={[h.trailhead_lat!, h.trailhead_lng!]} icon={greenIcon}>
                    <Popup>
                      <span style={{ fontWeight: 600 }}>{h.nombre}</span>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {hikesWithCoords.map((h, i) => (
                  <Marker key={i} position={[h.trailhead_lat!, h.trailhead_lng!]} icon={greenIcon}>
                    <Popup>
                      <span style={{ fontWeight: 600 }}>{h.nombre}</span>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        )}

        {/* Trail cards */}
        {filteredHikes.length > 0 ? (
          <TrailCards hikes={filteredHikes} showHeading={false} />
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            No hay senderos con este filtro.
          </p>
        )}
      </div>
    </motion.section>
  );
}
