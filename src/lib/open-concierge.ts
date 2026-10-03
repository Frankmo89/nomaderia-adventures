export const OPEN_CONCIERGE_EVENT = "nomaderia:open-concierge";

export function openConcierge(source: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_CONCIERGE_EVENT, { detail: { source } }));
}
