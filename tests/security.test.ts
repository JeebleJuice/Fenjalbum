import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { acquireSlot, isSafeRedirect, normalizeFileName, rateLimit, sha256, sha256File } from "@/lib/security";

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

  it("bounds concurrent work without limiting the total queue", () => {
    const first = acquireSlot("uploads", 2);
    const second = acquireSlot("uploads", 2);
    const blocked = acquireSlot("uploads", 2);
    expect(first.acquired).toBe(true);
    expect(second.acquired).toBe(true);
    expect(blocked.acquired).toBe(false);

    first.release();
    const next = acquireSlot("uploads", 2);
    expect(next.acquired).toBe(true);
    second.release();
    next.release();
  });

  it("hashes data consistently", () => {
    expect(sha256("hello")).toHaveLength(64);
  });

  it("streams file hashes without loading the whole file", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "fenjalbum-hash-"));
    const target = path.join(dir, "sample.bin");
    await fs.writeFile(target, "hello");
    await expect(sha256File(target)).resolves.toBe(sha256("hello"));
    await fs.rm(dir, { recursive: true, force: true });
  });
});
