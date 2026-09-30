import React from "react";
import { fontInter, fontMarker, fontOswald } from "../fonts";
import { COLORS } from "../types";

type Variant = "headline" | "body" | "accent";

export const HighlightText: React.FC<{
  text: string;
  highlight?: string;
  variant?: Variant;
  color?: string;
  style?: React.CSSProperties;
}> = ({ text, highlight, variant = "body", color = COLORS.cloud, style }) => {
  const baseFont =
    variant === "headline"
      ? fontOswald
      : variant === "accent"
        ? fontMarker
        : fontInter;
  const baseSize = variant === "headline" ? 64 : variant === "accent" ? 48 : 36;
  const weight = variant === "headline" ? 700 : 500;
  const letterSpacing = variant === "headline" ? "0.04em" : undefined;
  const textTransform = variant === "headline" ? ("uppercase" as const) : undefined;

  const parts = splitHighlight(text, highlight);

  return (
    <p
      style={{
        margin: 0,
        fontFamily: baseFont,
        fontSize: baseSize,
        fontWeight: weight,
        lineHeight: 1.2,
        color,
        letterSpacing,
        textTransform,
        textShadow:
          color === COLORS.cloud || color === "#FFFFFF"
            ? "0 2px 12px rgba(0,0,0,0.45)"
            : undefined,
        ...style,
      }}
    >
      {parts.map((p, i) =>
        p.hl ? (
          <span
            key={i}
            style={{
              color: COLORS.amber,
              fontFamily: fontMarker,
              fontWeight: 400,
              textTransform: "none",
              letterSpacing: "0",
            }}
          >
            {p.text}
          </span>
        ) : (
          <React.Fragment key={i}>{p.text}</React.Fragment>
        ),
      )}
    </p>
  );
};

function splitHighlight(
  text: string,
  highlight?: string,
): { text: string; hl: boolean }[] {
  if (!highlight || !highlight.trim()) return [{ text, hl: false }];
  const needle = highlight.trim();
  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx < 0) return [{ text, hl: false }];
  const before = text.slice(0, idx);
  const mid = text.slice(idx, idx + needle.length);
  const after = text.slice(idx + needle.length);
  const out: { text: string; hl: boolean }[] = [];
  if (before) out.push({ text: before, hl: false });
  out.push({ text: mid, hl: true });
  if (after) out.push({ text: after, hl: false });
  return out;
}
