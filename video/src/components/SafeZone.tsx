import React from "react";
import { AbsoluteFill } from "remotion";
import { HEIGHT, SAFE, WIDTH } from "../types";

/** Positions children inside the vertical/horizontal safe text band. */
export const SafeZone: React.FC<{
  children: React.ReactNode;
  align?: "center" | "bottom" | "top";
  style?: React.CSSProperties;
}> = ({ children, align = "center", style }) => {
  const padTop = SAFE.top;
  const padBottom = SAFE.bottom;
  const padRight = SAFE.right;
  const padLeft = 48;
  const bandHeight = HEIGHT - padTop - padBottom;

  let justifyContent: React.CSSProperties["justifyContent"] = "center";
  if (align === "top") justifyContent = "flex-start";
  if (align === "bottom") justifyContent = "flex-end";

  return (
    <AbsoluteFill
      style={{
        paddingTop: padTop,
        paddingBottom: padBottom,
        paddingLeft: padLeft,
        paddingRight: padRight,
        boxSizing: "border-box",
        pointerEvents: "none",
        ...style,
      }}
    >
      <div
        style={{
          width: WIDTH - padLeft - padRight,
          height: bandHeight,
          display: "flex",
          flexDirection: "column",
          justifyContent,
          gap: 16,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
