import { lazy, type ComponentType } from "react";

/**
 * Wraps React.lazy() with automatic retry logic for failed chunk loads.
 * Retries the dynamic import up to `maxRetries` times with exponential backoff.
 * On final failure after all retries, forces a single page reload (cache-bust)
 * to handle stale chunk hashes from new deploys.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  maxRetries = 2,
): ReturnType<typeof lazy> {
  return lazy(() => retryImport(importFn, maxRetries));
}

export async function retryImport<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  retries: number,
): Promise<{ default: T }> {
  try {
    return await importFn();
  } catch (error) {
    if (retries > 0) {
      // Exponential backoff: 1s, 2s
      await new Promise((r) => setTimeout(r, 1000 * (3 - retries)));
      return retryImport(importFn, retries - 1);
    }

    // All retries exhausted — likely a new deploy changed chunk hashes.
    // Force ONE reload to fetch new asset manifest.
    const RELOAD_KEY = "chunk-reload";
    const hasReloaded = sessionStorage.getItem(RELOAD_KEY);

    if (!hasReloaded) {
      sessionStorage.setItem(RELOAD_KEY, "1");
      window.location.reload();
      // Return a never-resolving promise to prevent React from rendering
      // the error boundary while the page reloads
      return new Promise(() => {});
    }

    // Already reloaded once — let error propagate to ErrorBoundary
    sessionStorage.removeItem(RELOAD_KEY);
    throw error;
  }
}
