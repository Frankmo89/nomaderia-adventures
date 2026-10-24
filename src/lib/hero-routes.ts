/**
 * Routes with a dark band (photo or forest-dark PageHeader) right behind the
 * fixed navbar. There the navbar starts transparent with a white logo; on every
 * other route it renders solid from scroll 0, or the white logo and menu vanish
 * on the light page background.
 *
 * Not here on purpose:
 * - /destinos/:slug — its photo carousel starts below the navbar (`pt-20`), so
 *   the navbar sits on the light background (bug 2026-10-21: only «IA» showed).
 * - /blog/:slug, /gear/:slug — no header band.
 */
const DARK_BAND_ROUTES = new Set([
  "/",
  "/calculadora",
  "/servicios",
  "/destinos",
  "/blog",
  "/gear",
  "/sobre-nosotros",
]);

/**
 * The home hero is a full-screen photo below lg (dark band behind the navbar)
 * but text-on-light beside a framed photo from lg up (ADR-047), so on desktop
 * the home navbar starts solid.
 */
const LIGHT_ON_DESKTOP = new Set(["/"]);

export function hasHeroForPath(pathname: string, { desktop = false }: { desktop?: boolean } = {}): boolean {
  if (desktop && LIGHT_ON_DESKTOP.has(pathname)) return false;
  return DARK_BAND_ROUTES.has(pathname);
}
