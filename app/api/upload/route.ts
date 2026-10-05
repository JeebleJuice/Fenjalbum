import { NextRequest, NextResponse } from "next/server";
import Busboy from "busboy";
import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { ensureBootstrapAdmin, requireUser, requireCsrfToken } from "@/lib/auth";
import { env } from "@/lib/env";
import { getClientIp, rateLimit } from "@/lib/security";
import { tempUploadPath } from "@/lib/storage";
import { importUploadedFile } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const temporaryFiles = new Set<string>();
  try {
    await ensureBootstrapAdmin();
    await requireUser();
    await requireCsrfToken(request);

    const ip = getClientIp(request.headers);
    const limited = rateLimit(`upload:${ip}`, env.RATE_LIMIT_UPLOAD_MAX, env.RATE_LIMIT_WINDOW_MS);
    if (!limited.allowed) return NextResponse.json({ error: "Too many uploads" }, { status: 429 });

    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
    }

    const results: Array<Record<string, unknown>> = [];
    const body = request.body;
    if (!body) return NextResponse.json({ error: "Missing body" }, { status: 400 });

    const busboy = Busboy({
      headers: { "content-type": contentType },
      limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 32 }
    });

    const pending: Promise<void>[] = [];
    let targetAlbumId: string | null = null;
    const fromWeb = Readable.fromWeb as unknown as (stream: ReadableStream<Uint8Array<ArrayBufferLike>>) => NodeJS.ReadableStream;
    const nodeStream = fromWeb(body);

    busboy.on("field", (fieldname: string, value: string) => {
      if (fieldname === "albumId") {
        targetAlbumId = value.trim() || null;
      }
    });

    busboy.on("file", (_fieldname: string, file: NodeJS.ReadableStream, info: { filename: string }) => {
      const filename = path.basename(info.filename || "upload.bin");
      const id = crypto.randomUUID();
      const tmpPath = tempUploadPath(id, filename);
      temporaryFiles.add(tmpPath);
      pending.push(
        (async () => {
          await mkdir(path.dirname(tmpPath), { recursive: true });
          const write = createWriteStream(tmpPath);
          await new Promise<void>((resolve, reject) => {
            file.pipe(write);
            file.on("limit", () => reject(new Error("File too large")));
            file.on("error", reject);
            write.on("error", reject);
            write.on("finish", resolve);
          });
          const imported = await importUploadedFile({
            tmpPath,
            originalFilename: filename,
            receivedSize: write.bytesWritten,
            albumId: targetAlbumId
          });
          temporaryFiles.delete(tmpPath);
          if (imported.duplicate) {
            results.push({ duplicate: true, existingId: imported.existing.id, filename });
            return;
          }
          results.push({ duplicate: false, id: imported.media.id, filename });
        })()
      );
    });

    const finished = new Promise<void>((resolve, reject) => {
      busboy.on("finish", resolve);
      busboy.on("error", reject);
    });

    nodeStream.pipe(busboy);
    await finished;
    await Promise.all(pending);
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await Promise.all(Array.from(temporaryFiles, (tmpPath) => rm(tmpPath, { force: true }).catch(() => undefined)));
  }
}
