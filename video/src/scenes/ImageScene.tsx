import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { HighlightText } from "../components/HighlightText";
import { SafeZone } from "../components/SafeZone";
import { resolveSrc } from "../resolveSrc";
import { COLORS, type ReelScene } from "../types";

export const ImageScene: React.FC<{
  scene: ReelScene;
  showCredit?: string;
}> = ({ scene, showCredit }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.12], {
    extrapolateRight: "clamp",
  });
  const src = resolveSrc(scene.src);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.forest }}>
      {src ? (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <Img
            src={src}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${scale})`,
            }}
          />
          <AbsoluteFill
            style={{
              background:
                "linear-gradient(180deg, rgba(20,32,26,0.4) 0%, rgba(20,32,26,0.2) 45%, rgba(20,32,26,0.6) 100%)",
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
