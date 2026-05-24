/**
 * Vendor-agnostic analytics layer.
 *
 * Forwards events to every connected provider (GA4, Facebook Pixel, etc.)
 * and stays completely silent when none is configured.
 *
 * Usage:
 *   import { trackEvent } from "@/lib/analytics";
 *   trackEvent("quiz_completed", { result: "playa" });
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Fire a named event with optional parameters to all active analytics providers.
 *
 * - Google Analytics 4: sent via `gtag("event", …)`
 * - Facebook Pixel: sent via `fbq("trackCustom", …)`
 *
 * If no provider script is loaded the call is a no-op (zero errors, zero network).
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
): void {
  // GA4
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }

  // Facebook Pixel
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", eventName, params);
  }
}
