import crypto from "node:crypto";
import path from "node:path";
import { promises as fs } from "node:fs";
import { MediaType } from "@prisma/client";
import sanitize from "sanitize-filename";
import { prisma } from "@/lib/db";
import { ensureStorageRoots, mediaOriginalPath } from "@/lib/storage";
import { sha256File } from "@/lib/security";
import { fileTypeFromPath } from "@/lib/file-signature";

export type UploadedTempFile = {
  tmpPath: string;
  originalFilename: string;
  receivedSize: number;
  albumId?: string | null;
};

const allowedMimes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska"
]);

export async function validateUploadedFile(filePath: string) {
  const type = await fileTypeFromPath(filePath);
  if (!type || !allowedMimes.has(type.mime)) {
    throw new Error("Unsupported file type");
  }
  return type;
}

export function normalizeUploadName(name: string) {
  const clean = sanitize(name).trim().replace(/\s+/g, " ");
  return clean.length > 0 ? clean : "file";
}

async function moveFile(source: string, destination: string) {
  try {
    await fs.rename(source, destination);
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "EXDEV") {
      await fs.copyFile(source, destination);
      await fs.unlink(source);
      return;
    }
    throw error;
  }
}

export async function importUploadedFile(file: UploadedTempFile) {
  await ensureStorageRoots();
  const type = await validateUploadedFile(file.tmpPath);
  const hash = await sha256File(file.tmpPath);
  const duplicate = await prisma.media.findUnique({ where: { hash } });
  if (duplicate) {
    await fs.unlink(file.tmpPath).catch(() => undefined);
    return { duplicate: true as const, existing: duplicate };
  }

  const id = crypto.randomUUID();
  const safeFilename = normalizeUploadName(file.originalFilename);
  const finalPath = mediaOriginalPath(id, safeFilename);
  await fs.mkdir(path.dirname(finalPath), { recursive: true });
  await moveFile(file.tmpPath, finalPath);

  const mediaType: MediaType = type.mime.startsWith("image/") ? "PHOTO" : "VIDEO";
  let media;
  try {
    media = await prisma.$transaction(async (transaction) => {
      const created = await transaction.media.create({
        data: {
          id,
          originalFilename: file.originalFilename,
          safeFilename,
          mediaType,
          mimeType: type.mime,
          size: BigInt(file.receivedSize),
          hash,
          storagePath: finalPath,
          albumId: file.albumId || null,
          processingStatus: "PENDING"
        }
      });
      await transaction.processingJob.create({ data: { mediaId: created.id, kind: "METADATA" } });
      return created;
    });
  } catch (error) {
    await fs.rm(path.dirname(finalPath), { recursive: true, force: true });
    throw error;
  }

  return { duplicate: false as const, media };
}
