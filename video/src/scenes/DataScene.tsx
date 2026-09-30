import React from "react";
import { AbsoluteFill } from "remotion";
import { HighlightText } from "../components/HighlightText";
import { SafeZone } from "../components/SafeZone";
import { fontInter, fontOswald } from "../fonts";
import { COLORS, type ReelData, type ReelScene } from "../types";

const LABELS: { key: keyof ReelData; label: string }[] = [
  { key: "park", label: "Parque" },
  { key: "driveFromSD", label: "Desde SD" },
  { key: "level", label: "Nivel" },
  { key: "fee", label: "Entrada" },
  { key: "bestSeason", label: "Mejor temporada" },
];

export const DataScene: React.FC<{
  scene: ReelScene;
  data?: ReelData;
  showCredit?: string;
}> = ({ scene, data, showCredit }) => {
  const rows = LABELS.filter((l) => data?.[l.key]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.green }}>
      <SafeZone align="center">
        {scene.text ? (
          <HighlightText
            text={scene.text}
            highlight={scene.highlight}
            variant="headline"
            color={COLORS.cloud}
            style={{ marginBottom: 28 }}
          />
        ) : (
          <p
            style={{
              margin: 0,
              marginBottom: 28,
              fontFamily: fontOswald,
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: COLORS.cloud,
            }}
          >
            Datos clave
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {rows.map(({ key, label }) => (
            <div key={key}>
              <div
                style={{
                  fontFamily: fontOswald,
                  fontSize: 22,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(251,250,247,0.7)",
                  marginBottom: 4,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: fontInter,
                  fontSize: 36,
                  fontWeight: 600,
                  color: COLORS.cloud,
                }}
              >
                {data?.[key]}
              </div>
            </div>
          ))}
        </div>
      </SafeZone>
      {showCredit ? (
        <SafeZone align="bottom">
          <HighlightText
            text={showCredit}
            variant="body"
            color={COLORS.cloud}
            style={{ fontSize: 22, opacity: 0.8, fontWeight: 400 }}
          />
        </SafeZone>
      ) : null}
    </AbsoluteFill>
  );
};
