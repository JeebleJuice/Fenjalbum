import crypto from "node:crypto";
import path from "node:path";
import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import { loadLocalEnv } from "@/lib/load-env";

await loadLocalEnv(import.meta.url);
const root = path.resolve(process.argv[2] ?? "/import");
const supported = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic", ".heif", ".mp4", ".mov", ".webm", ".mkv"]);
const { env } = await import("@/lib/env");
const { prisma } = await import("@/lib/db");
const { importUploadedFile } = await import("@/lib/upload");

async function* walk(directory: string): AsyncGenerator<string> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(target);
    else if (supported.has(path.extname(entry.name).toLowerCase())) yield target;
  }
}

let imported = 0;
let duplicates = 0;
let failed = 0;
await mkdir(env.UPLOAD_TMP_ROOT, { recursive: true });
for await (const source of walk(root)) {
  const tmpPath = path.join(env.UPLOAD_TMP_ROOT, `${crypto.randomUUID()}-${path.basename(source)}`);
  try {
    await cp(source, tmpPath);
    const info = await stat(tmpPath);
    const result = await importUploadedFile({ tmpPath, originalFilename: path.basename(source), receivedSize: info.size });
    if (result.duplicate) duplicates += 1;
    else imported += 1;
    console.log(`${result.duplicate ? "duplicate" : "imported"}: ${source}`);
  } catch (error) {
    failed += 1;
    await rm(tmpPath, { force: true });
    console.error(`failed: ${source}: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}
console.log(`Import complete: ${imported} imported, ${duplicates} duplicates, ${failed} failed.`);
await prisma.$disconnect();
if (failed) process.exitCode = 1;
