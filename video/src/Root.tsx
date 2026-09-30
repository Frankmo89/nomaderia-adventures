import React from "react";
import { Composition, type CalculateMetadataFunction } from "remotion";
import { Reel } from "./Reel";
import {
  FPS,
  HEIGHT,
  WIDTH,
  totalDurationFrames,
  type ReelScript,
} from "./types";

const defaultProps: ReelScript = {
  id: "C01-09",
  scenes: [
    {
      type: "card",
      seconds: 3,
      text: "Placeholder reel",
      highlight: "reel",
    },
  ],
  data: {},
  credit: "Video: NPS",
  cta: "Haz el quiz gratis en nomaderia.com",
};

const calculateMetadata: CalculateMetadataFunction<ReelScript> = ({
  props,
}) => ({
  durationInFrames: totalDurationFrames(props),
  props,
});

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Reel"
        component={Reel}
        durationInFrames={90}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={defaultProps}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
