import DifficultyBadge from "./DifficultyBadge";

export interface SignatureHike {
  nombre: string;
  distancia_km?: number | null;
  duracion_horas?: number | null;
  desnivel_m?: number | null;
  apto_principiante?: boolean | null;
  nota?: string | null;
  difficulty?: string | null;
}

interface TrailCardsProps {
  hikes: SignatureHike[];
}

function inferDifficulty(hike: SignatureHike): string {
  if (hike.difficulty) return hike.difficulty;
  if (hike.apto_principiante === true) return "easy";
  if (hike.distancia_km != null && hike.distancia_km > 20) return "challenging";
  return "moderate";
}

function buildStatsLine(hike: SignatureHike): string {
  const parts: string[] = [];
  if (hike.distancia_km != null) parts.push(`${hike.distancia_km} km`);
  if (hike.duracion_horas != null) parts.push(`${hike.duracion_horas} h`);
  if (hike.desnivel_m != null) parts.push(`↑${hike.desnivel_m} m`);
  return parts.join(" · ");
}

export default function TrailCards({ hikes }: TrailCardsProps) {
  if (!hikes.length) return null;

  return (
    <div className="mt-8">
      <h3
        className="font-serif font-bold text-[#1C1917] mb-4"
        style={{ fontSize: 22 }}
      >
        Senderos destacados
      </h3>
      <div>
        {hikes.map((hike, i) => {
          const difficulty = inferDifficulty(hike);
          const statsLine  = buildStatsLine(hike);

          return (
            <div
              key={i}
              className="bg-white rounded-xl"
              style={{
                boxShadow:   "0 1px 4px rgba(0,0,0,0.08)",
                marginBottom: i < hikes.length - 1 ? 12 : 0,
              }}
            >
              <div style={{ padding: "10px 12px" }}>
                {/* Row 1: badge + nombre */}
                <div className="flex items-center gap-2 flex-wrap">
                  <DifficultyBadge difficultyLevel={difficulty} size="sm" />
                  <span
                    className="font-sans font-semibold text-[#1C1917] leading-tight"
                    style={{ fontSize: 16 }}
                  >
                    {hike.nombre}
                  </span>
                </div>

                {/* Row 2: stats */}
                {statsLine && (
                  <p
                    className="font-sans text-[#6B7280] mt-1"
                    style={{ fontSize: 13 }}
                  >
                    {statsLine}
                  </p>
                )}

                {/* Row 3: beginner friendly */}
                {hike.apto_principiante === true && (
                  <p
                    className="font-sans text-[#166534] mt-1"
                    style={{ fontSize: 13 }}
                  >
                    ✓ Apto para principiantes
                  </p>
                )}

                {/* Row 4: nota */}
                {hike.nota?.trim() && (
                  <p
                    className="font-sans text-[#4B5563] mt-1.5 line-clamp-2"
                    style={{ fontSize: 14 }}
                  >
                    {hike.nota.trim()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
