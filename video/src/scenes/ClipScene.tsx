import React from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";
import { HighlightText } from "../components/HighlightText";
import { SafeZone } from "../components/SafeZone";
import { resolveSrc } from "../resolveSrc";
import { COLORS, type ReelScene } from "../types";

export const ClipScene: React.FC<{
  scene: ReelScene;
  showCredit?: string;
}> = ({ scene, showCredit }) => {
  const src = resolveSrc(scene.src);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.forest }}>
      {src ? (
        <AbsoluteFill>
          <OffthreadVideo
            src={src}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <AbsoluteFill
            style={{
              background:
                "linear-gradient(180deg, rgba(20,32,26,0.35) 0%, rgba(20,32,26,0.15) 40%, rgba(20,32,26,0.55) 100%)",
            }}
          />
        </AbsoluteFill>
      ) : null}
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
            style={{ fontSize: 22, opacity: 0.75, fontWeight: 400 }}
          />
        </SafeZone>
      ) : null}
    </AbsoluteFill>
  );
};
