import { describe, expect, it } from "vitest";
import { errorMessage } from "./error-message";

describe("errorMessage", () => {
  it("reads a Supabase error object", () => {
    const postgrestError = {
      message: 'new row violates row-level security policy for table "media_slider"',
      code: "42501",
      details: null,
      hint: null,
    };
    expect(errorMessage(postgrestError)).toBe(postgrestError.message);
  });

  it("reads an Error", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
  });

  it("falls back when there is no message", () => {
    expect(errorMessage(undefined)).toBe("Error desconocido");
    expect(errorMessage({ code: "x" }, "Otro")).toBe("Otro");
  });
});
