import { describe, it, expect, beforeEach, vi } from "vitest";
import { delay } from "./delay";

describe("delay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should resolve after specified milliseconds", async () => {
    const promise = delay(1000);

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    await expect(promise).resolves.toBeUndefined();
  });

  it("should resolve immediately for 0ms delay", async () => {
    const promise = delay(0);

    vi.advanceTimersByTime(0);

    await expect(promise).resolves.toBeUndefined();
  });

  it("should not resolve before specified time", async () => {
    let resolved = false;
    const promise = delay(1000).then(() => {
      resolved = true;
    });

    // Advance time by less than delay
    vi.advanceTimersByTime(500);
    await Promise.resolve(); // Flush promise queue

    expect(resolved).toBe(false);

    // Advance remaining time
    vi.advanceTimersByTime(500);
    await promise;

    expect(resolved).toBe(true);
  });

  it("should handle multiple delays concurrently", async () => {
    const delays = [delay(100), delay(200), delay(300)];

    vi.advanceTimersByTime(300);

    await expect(Promise.all(delays)).resolves.toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });
});
