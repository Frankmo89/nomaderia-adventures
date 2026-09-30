import React from "react";
import { AbsoluteFill } from "remotion";
import { HighlightText } from "../components/HighlightText";
import { SafeZone } from "../components/SafeZone";
import { fontOswald } from "../fonts";
import { COLORS } from "../types";

export const CtaScene: React.FC<{
  cta: string;
  credit?: string;
}> = ({ cta, credit }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.forest }}>
      <SafeZone align="center">
        <p
          style={{
            margin: 0,
            marginBottom: 24,
            fontFamily: fontOswald,
            fontSize: 28,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: COLORS.green,
          }}
        >
          Nomaderia
        </p>
        <HighlightText
          text={cta}
          variant="headline"
          color={COLORS.cloud}
          style={{ fontSize: 56 }}
        />
      </SafeZone>
      {credit ? (
        <SafeZone align="bottom">
          <HighlightText
            text={credit}
            variant="body"
            color={COLORS.cloud}
            style={{ fontSize: 20, opacity: 0.65, fontWeight: 400 }}
          />
        </SafeZone>
      ) : null}
    </AbsoluteFill>
  );
};
