import { describe, expect, it } from "vitest";
import { isSafeRedirect, normalizeFileName, rateLimit, sha256 } from "@/lib/security";

describe("security helpers", () => {
  it("normalizes filenames", () => {
    expect(normalizeFileName("  ./my  photo?.jpg  ")).toBe("my photo.jpg");
  });

  it("rejects unsafe redirects", () => {
    expect(isSafeRedirect("https://example.com")).toBe(false);
    expect(isSafeRedirect("//example.com")).toBe(false);
    expect(isSafeRedirect("/albums")).toBe(true);
  });

  it("rate limits repeated requests", () => {
    const first = rateLimit("ip", 1, 10_000);
    const second = rateLimit("ip", 1, 10_000);
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
  });

  it("hashes data consistently", () => {
    expect(sha256("hello")).toHaveLength(64);
  });
});
