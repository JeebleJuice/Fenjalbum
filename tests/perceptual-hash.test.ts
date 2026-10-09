import { describe, expect, it } from "vitest";
import { findLikelyUndatedDuplicates } from "@/lib/duplicate-media";
import { perceptualHashDistance } from "@/lib/perceptual-hash";

describe("perceptual duplicate detection", () => {
  it("counts differing hash bits", () => {
    expect(perceptualHashDistance("0000000000000000", "0000000000000003")).toBe(2);
    expect(perceptualHashDistance("not-a-hash", "0000000000000000")).toBe(Number.POSITIVE_INFINITY);
  });

  it("pairs an undated photo with the closest dated visual match", () => {
    const now = new Date("2026-10-10T10:00:00Z");
    const pairs = findLikelyUndatedDuplicates([
      { id: "missing", originalFilename: "copy.jpg", perceptualHash: "0000000000000001", captureAt: null, width: 1200, height: 800, uploadedAt: now },
      { id: "match", originalFilename: "original.jpg", perceptualHash: "0000000000000000", captureAt: new Date("2025-05-01T10:00:00Z"), width: 3000, height: 2000, uploadedAt: now },
      { id: "other", originalFilename: "other.jpg", perceptualHash: "ffffffffffffffff", captureAt: new Date("2025-05-02T10:00:00Z"), width: 3000, height: 2000, uploadedAt: now }
    ]);

    expect(pairs).toHaveLength(1);
    expect(pairs[0]?.dated.id).toBe("match");
    expect(pairs[0]?.distance).toBe(1);
  });

  it("does not pair materially different aspect ratios", () => {
    const now = new Date("2026-10-10T10:00:00Z");
    expect(findLikelyUndatedDuplicates([
      { id: "square", originalFilename: "square.jpg", perceptualHash: "0000000000000000", captureAt: null, width: 1200, height: 1200, uploadedAt: now },
      { id: "landscape", originalFilename: "landscape.jpg", perceptualHash: "0000000000000000", captureAt: now, width: 1200, height: 800, uploadedAt: now }
    ])).toEqual([]);
  });
});
