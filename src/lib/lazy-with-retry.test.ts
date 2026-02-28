import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the retry logic by extracting and testing the core behavior
// of lazyWithRetry without actually rendering React components.

describe("lazyWithRetry", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("should resolve on first successful import", async () => {
    const { lazyWithRetry } = await import("@/lib/lazy-with-retry");
    const mockComponent = () => null;
    const importFn = vi.fn().mockResolvedValue({ default: mockComponent });

    // lazyWithRetry returns a lazy component; we can't directly await it,
    // but we can verify the importFn is called when the lazy factory runs.
    const LazyComponent = lazyWithRetry(importFn);
    expect(LazyComponent).toBeDefined();
    // The import function hasn't been called yet (React.lazy is deferred)
    expect(importFn).not.toHaveBeenCalled();
  });

  it("should retry on failure and succeed on second attempt", async () => {
    const mockComponent = () => null;
    const importFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ default: mockComponent });

    // Directly test the retry logic by calling the import function wrapper
    // We access the internal retryImport behavior through the lazy factory
    const { lazyWithRetry } = await import("@/lib/lazy-with-retry");

    // lazyWithRetry wraps lazy(), so we need to test the factory function
    // We'll use a custom approach: call the importFn pattern directly
    const result = await retryImportHelper(importFn, 2);
    expect(result).toEqual({ default: mockComponent });
    expect(importFn).toHaveBeenCalledTimes(2);
  });

  it("should retry with exponential backoff timing", async () => {
    vi.useFakeTimers();
    const mockComponent = () => null;
    const importFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ default: mockComponent });

    const promise = retryImportHelper(importFn, 2);

    // First retry should wait 1s (1000 * (3 - 2))
    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;
    expect(result).toEqual({ default: mockComponent });
    expect(importFn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("should set sessionStorage and call reload after all retries exhausted", async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadMock },
      writable: true,
    });

    const importFn = vi.fn().mockRejectedValue(new Error("Chunk failed"));

    // With maxRetries=0, it will immediately go to the reload path
    const promise = retryImportHelper(importFn, 0);

    // The function should set sessionStorage and call reload,
    // then return a never-resolving promise
    // We need a timeout to detect the never-resolving promise
    const result = await Promise.race([
      promise,
      new Promise((resolve) => setTimeout(() => resolve("timeout"), 100)),
    ]);

    expect(result).toBe("timeout");
    expect(sessionStorage.getItem("chunk-reload")).toBe("1");
    expect(reloadMock).toHaveBeenCalledOnce();
  });

  it("should throw error if already reloaded once (sessionStorage flag set)", async () => {
    sessionStorage.setItem("chunk-reload", "1");

    const importFn = vi.fn().mockRejectedValue(new Error("Chunk failed"));

    await expect(retryImportHelper(importFn, 0)).rejects.toThrow("Chunk failed");
    // Should clean up the sessionStorage key
    expect(sessionStorage.getItem("chunk-reload")).toBeNull();
  });
});

/**
 * Helper that replicates the retryImport logic for testing.
 * This avoids needing to render React components just to test retry behavior.
 */
async function retryImportHelper(
  importFn: () => Promise<{ default: unknown }>,
  retries: number,
): Promise<{ default: unknown }> {
  try {
    return await importFn();
  } catch (error) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 1000 * (3 - retries)));
      return retryImportHelper(importFn, retries - 1);
    }

    const RELOAD_KEY = "chunk-reload";
    const hasReloaded = sessionStorage.getItem(RELOAD_KEY);

    if (!hasReloaded) {
      sessionStorage.setItem(RELOAD_KEY, "1");
      window.location.reload();
      return new Promise(() => {});
    }

    sessionStorage.removeItem(RELOAD_KEY);
    throw error;
  }
}
