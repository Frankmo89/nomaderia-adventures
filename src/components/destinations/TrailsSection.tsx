import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import TrailCards, { type SignatureHike } from "@/components/destinations/TrailCards";
import { cn } from "@/lib/utils";

interface TrailsSectionProps {
  hikes: SignatureHike[];
}

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

export default function TrailsSection({ hikes }: TrailsSectionProps) {
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

  const mapCenter = useMemo(() => {
    if (!hikesWithCoords.length) return null;
    const lat = hikesWithCoords.reduce((s, h) => s + h.trailhead_lat!, 0) / hikesWithCoords.length;
    const lng = hikesWithCoords.reduce((s, h) => s + h.trailhead_lng!, 0) / hikesWithCoords.length;
    return [lat, lng] as [number, number];
  }, [hikesWithCoords]);

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

        {/* Map — only rendered when at least one hike has coordinates */}
        {mapCenter && (
          <div
            className="rounded-xl overflow-hidden mb-8 border border-border"
            style={{ height: 280 }}
          >
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
                <Marker
                  key={i}
                  position={[h.trailhead_lat!, h.trailhead_lng!]}
                  icon={greenIcon}
                >
                  <Popup>
                    <span style={{ fontWeight: 600 }}>{h.nombre}</span>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
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
