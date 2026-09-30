import React from "react";
import { AbsoluteFill } from "remotion";
import { HighlightText } from "../components/HighlightText";
import { SafeZone } from "../components/SafeZone";
import { COLORS, type ReelScene } from "../types";

export const CardScene: React.FC<{
  scene: ReelScene;
  showCredit?: string;
}> = ({ scene, showCredit }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.green }}>
      <SafeZone align="center">
        {scene.text ? (
          <HighlightText
            text={scene.text}
            highlight={scene.highlight}
            variant="headline"
            color={COLORS.cloud}
          />
        ) : null}
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
