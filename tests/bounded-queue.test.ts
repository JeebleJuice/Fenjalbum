import { describe, expect, it } from "vitest";
import { runBoundedQueue } from "@/lib/bounded-queue";

describe("bounded upload queue", () => {
  it("processes a 505-file selection without exceeding its concurrency limit", async () => {
    const files = Array.from({ length: 505 }, (_, index) => index);
    const processed: number[] = [];
    let active = 0;
    let peak = 0;

    await runBoundedQueue(files, 3, async (file) => {
      active += 1;
      peak = Math.max(peak, active);
      await Promise.resolve();
      processed.push(file);
      active -= 1;
    });

    expect(peak).toBe(3);
    expect(processed).toHaveLength(505);
    expect(new Set(processed).size).toBe(505);
  });
});
