import { describe, it, expect, vi, beforeEach } from "vitest";
import { lazyWithRetry, retryImport } from "@/lib/lazy-with-retry";

describe("lazyWithRetry", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("should resolve on first successful import", () => {
    const mockComponent = () => null;
    const importFn = vi.fn().mockResolvedValue({ default: mockComponent });

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

    const result = await retryImport(importFn, 2);
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

    const promise = retryImport(importFn, 2);

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
    const promise = retryImport(importFn, 0);

    // The function should set sessionStorage and call reload,
    // then return a never-resolving promise
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

    await expect(retryImport(importFn, 0)).rejects.toThrow("Chunk failed");
    // Should clean up the sessionStorage key
    expect(sessionStorage.getItem("chunk-reload")).toBeNull();
  });
});
