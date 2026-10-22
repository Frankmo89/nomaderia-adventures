/**
 * Human-readable message from anything a `catch` receives.
 * Supabase returns plain `{ message, code, ... }` objects, not `Error`
 * instances, so `err instanceof Error` alone hid the real cause behind
 * "Error desconocido".
 */
export function errorMessage(err: unknown, fallback = "Error desconocido"): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const { message } = err as { message: unknown };
    if (typeof message === "string" && message) return message;
  }
  if (typeof err === "string" && err) return err;
  return fallback;
}
