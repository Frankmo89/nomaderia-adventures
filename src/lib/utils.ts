import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// `.text-shadow-hero` / `.text-shadow-card` are custom utilities (src/index.css).
// Stock tailwind-merge reads `text-shadow-*` as a text colour and drops the real
// colour class next to it (`text-white/90` vanished from the navbar links over
// the hero). Registering them as their own group keeps both.
const twMerge = extendTailwindMerge<"text-shadow">({
  extend: {
    classGroups: {
      "text-shadow": [{ "text-shadow": ["hero", "card"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
