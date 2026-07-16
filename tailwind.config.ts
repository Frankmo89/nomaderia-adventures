import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        condensed: ["'Oswald'", "sans-serif"],
        serif: ["'Playfair Display'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      fontSize: {
        display: ["clamp(3.5rem, 7vw, 6rem)", { lineHeight: "0.95", letterSpacing: "-0.04em" }],
        h1: ["clamp(2.5rem, 5vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.035em" }],
        h2: ["clamp(2rem, 3.5vw, 3.25rem)", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        h3: ["clamp(1.5rem, 2.25vw, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        eyebrow: ["clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)", { lineHeight: "1.2", letterSpacing: "0.16em" }],
      },
      maxWidth: {
        text: "42rem",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        /* Acento exclusivo del Hero de home (sunset amber legacy). NO usar fuera de HeroSection. */
        "hero-accent": "hsl(var(--hero-accent))",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sand: "hsl(var(--sand))",
        forest: "hsl(var(--forest))",
        sunset: "hsl(var(--sunset))",
        trail: "hsl(var(--trail))",
        sky: "hsl(var(--sky))",
        charcoal: "hsl(var(--charcoal))",
        stone: "hsl(var(--stone))",
        walnut: "hsl(var(--walnut))",
        clay: "hsl(var(--clay))",

        /* ── Design System Fase 1 — tokens base (docs/design-system.md §5) ──
           Solo se AGREGAN; no se aplican a componentes todavía (Fase 2+).
           `sky` (#2E6F9E) y `stone` (#E4E2DB) se difieren: ya existen arriba con
           otros valores y se migran junto a sus componentes (ver pending-tasks). */
        green: "#1F6F43",
        "green-dark": "#16512F",
        "green-wash": "#E8F1EA",
        terracotta: "#C2562F",
        amber: "#E08A1E",
        warning: "#E08A1E", // alias semántico de amber — advertencias, nunca interactivo de marca

        "forest-dark": "#14201A",
        spruce: "#1E2C24",
        cloud: "#FBFAF7",
        ink: "#13211A",
        slate: "#384741",
        sage: "#6E7A74",
        mist: "#EAF0EC",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      boxShadow: {
        "editorial": "0 16px 40px rgba(61, 47, 35, 0.08)",
        "editorial-hover": "0 22px 56px rgba(61, 47, 35, 0.12)",
      },
    },
  },
  plugins: [tailwindcssAnimate, typography],
} satisfies Config;
