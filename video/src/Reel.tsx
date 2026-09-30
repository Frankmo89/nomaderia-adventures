import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { CtaScene } from "./scenes/CtaScene";
import { CardScene } from "./scenes/CardScene";
import { ClipScene } from "./scenes/ClipScene";
import { DataScene } from "./scenes/DataScene";
import { ImageScene } from "./scenes/ImageScene";
import {
  CTA_SECONDS,
  COLORS,
  sceneFrames,
  type ReelScript,
} from "./types";

export const Reel: React.FC<ReelScript> = (script) => {
  const scenes = script.scenes ?? [];
  let cursor = 0;
  const lastIndex = scenes.length - 1;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.forest }}>
      {scenes.map((scene, i) => {
        const durationInFrames = sceneFrames(scene.seconds ?? 3);
        const from = cursor;
        cursor += durationInFrames;
        const showCredit =
          i === lastIndex && script.credit ? script.credit : undefined;

        let body: React.ReactNode;
        switch (scene.type) {
          case "clip":
            body = <ClipScene scene={scene} showCredit={showCredit} />;
            break;
          case "image":
            body = <ImageScene scene={scene} showCredit={showCredit} />;
            break;
          case "card":
            body = <CardScene scene={scene} showCredit={showCredit} />;
            break;
          case "data":
            body = (
              <DataScene
                scene={scene}
                data={script.data}
                showCredit={showCredit}
              />
            );
            break;
          default:
            body = <CardScene scene={scene} showCredit={showCredit} />;
        }

        return (
          <Sequence
            key={`${script.id}-${i}`}
            from={from}
            durationInFrames={durationInFrames}
            name={`${scene.type}-${i}`}
          >
            {body}
          </Sequence>
        );
      })}
      <Sequence
        from={cursor}
        durationInFrames={sceneFrames(CTA_SECONDS)}
        name="cta"
      >
        <CtaScene
          cta={script.cta ?? "Haz el quiz gratis en nomaderia.com"}
          credit={script.credit}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
