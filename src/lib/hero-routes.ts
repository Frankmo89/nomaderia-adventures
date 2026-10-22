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

export function hasHeroForPath(pathname: string): boolean {
  return DARK_BAND_ROUTES.has(pathname);
}
