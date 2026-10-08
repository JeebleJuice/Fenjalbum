import crypto from "node:crypto";
import { createReadStream } from "node:fs";
import sanitize from "sanitize-filename";
import { env } from "@/lib/env";

type Bucket = { tokens: number; updatedAt: number };
type SlotPool = { active: number };

const buckets = new Map<string, Bucket>();
const slotPools = new Map<string, SlotPool>();

export function normalizeFileName(input: string) {
  const name = sanitize(input).trim().replace(/\s+/g, " ").replace(/^[.\/\\_-]+/, "");
  return name.length > 0 ? name : "file";
}

export function sha256(buffer: Buffer | string) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function sha256File(filePath: string) {
  const hash = crypto.createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk as Buffer);
  return hash.digest("hex");
}

export function newToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function isSafeRedirect(target: string | null | undefined) {
  if (!target) return false;
  if (!target.startsWith("/")) return false;
  if (target.startsWith("//")) return false;
  return !target.includes("\\");
}

export function getClientIp(headers: Headers | Record<string, string | string[] | undefined>) {
  const value =
    headers instanceof Headers
      ? headers.get("x-forwarded-for") ?? headers.get("x-real-ip")
      : Array.isArray(headers["x-forwarded-for"])
        ? headers["x-forwarded-for"][0]
        : headers["x-forwarded-for"] ?? headers["x-real-ip"];
  if (Array.isArray(value)) return value[0] ?? "local";
  return (value?.split(",")[0] ?? "local").trim() || "local";
}

export function rateLimit(key: string, limit: number, windowMs = env.RATE_LIMIT_WINDOW_MS) {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: limit, updatedAt: now };
  const elapsed = now - bucket.updatedAt;
  if (elapsed > windowMs) {
    bucket.tokens = limit;
    bucket.updatedAt = now;
  }
  if (bucket.tokens <= 0) {
    buckets.set(key, bucket);
    return { allowed: false, retryAfterMs: windowMs - elapsed };
  }
  bucket.tokens -= 1;
  bucket.updatedAt = now;
  buckets.set(key, bucket);
  return { allowed: true, retryAfterMs: 0 };
}

export function acquireSlot(key: string, limit: number) {
  const pool = slotPools.get(key) ?? { active: 0 };
  if (pool.active >= limit) {
    return { acquired: false as const, release: () => undefined };
  }

  pool.active += 1;
  slotPools.set(key, pool);
  let released = false;

  return {
    acquired: true as const,
    release: () => {
      if (released) return;
      released = true;
      pool.active -= 1;
      if (pool.active === 0) slotPools.delete(key);
    }
  };
}
