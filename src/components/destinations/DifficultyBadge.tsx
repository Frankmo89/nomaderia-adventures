interface StyleDef {
  bg: string;
  text: string;
  label: string;
}

const BADGE_STYLES: Record<string, StyleDef> = {
  easy:       { bg: "#DCFCE7", text: "#166534", label: "Fácil" },
  moderate:   { bg: "#FEF3C7", text: "#92400E", label: "Moderado" },
  challenging:{ bg: "#FEE2E2", text: "#991B1B", label: "Desafiante" },
};

interface DifficultyBadgeProps {
  difficultyLevel: string;
  beginnerFriendly?: boolean | null;
  /** "sm" = 22px height (card use), "md" = 32px height (panel heading use) */
  size?: "sm" | "md";
}

export default function DifficultyBadge({
  difficultyLevel,
  beginnerFriendly,
  size = "md",
}: DifficultyBadgeProps) {
  const style =
    BADGE_STYLES[difficultyLevel] ?? { bg: "#F3F4F6", text: "#4B5563", label: difficultyLevel };

  const height  = size === "sm" ? 22  : 32;
  const padding = size === "sm" ? "4px 8px" : "8px 16px";
  const fontSize = size === "sm" ? 11 : 13;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="font-sans font-semibold leading-none"
        style={{
          background:   style.bg,
          color:        style.text,
          height,
          padding,
          fontSize,
          borderRadius: 999,
          display:      "inline-flex",
          alignItems:   "center",
        }}
      >
        {style.label}
      </span>
      {beginnerFriendly && (
        <span
          className="font-sans font-medium"
          style={{
            background:   "#DCFCE7",
            color:        "#166534",
            border:       "1px solid rgba(22,101,52,0.2)",
            height:       size === "sm" ? 22 : 30,
            padding:      size === "sm" ? "4px 8px" : "6px 12px",
            fontSize:     size === "sm" ? 11 : 13,
            borderRadius: 999,
            display:      "inline-flex",
            alignItems:   "center",
          }}
        >
          Apto para principiantes
        </span>
      )}
    </div>
  );
}
