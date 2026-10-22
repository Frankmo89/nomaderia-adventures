import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("keeps the text colour next to a text-shadow utility", () => {
    // Navbar links over the hero (Navbar.tsx, scroll 0).
    const classes = cn(
      "text-sm font-medium",
      "text-white/90 hover:text-white text-shadow-hero",
    ).split(" ");
    expect(classes).toContain("text-white/90");
    expect(classes).toContain("text-shadow-hero");
  });

  it("lets a later text-shadow replace an earlier one", () => {
    expect(cn("text-shadow-hero", "text-shadow-card")).toBe("text-shadow-card");
  });

  it("still merges plain colour classes", () => {
    expect(cn("text-white", "text-ink")).toBe("text-ink");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });
});
