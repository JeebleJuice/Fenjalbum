import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureStorageRoots, mediaPosterPath, mediaThumbPath, removeTree } from "@/lib/storage";

async function ensureParent(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function probeVideo(filePath: string) {
  return new Promise<{
    width?: number;
    height?: number;
    duration?: number;
    metadata?: Prisma.InputJsonValue;
  }>((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height:format=duration",
      "-of",
      "json",
      filePath
    ]);
    let stdout = "";
    let stderr = "";
    ffprobe.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    ffprobe.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    ffprobe.on("error", reject);
    ffprobe.on("close", (code) => {
      if (code !== 0) return reject(new Error(stderr || "ffprobe failed"));
      const parsed = JSON.parse(stdout) as {
        streams?: Array<{ width?: number; height?: number }>;
        format?: { duration?: string };
      };
      const stream = parsed.streams?.[0];
      resolve({
        width: stream?.width,
        height: stream?.height,
        duration: parsed.format?.duration ? Number(parsed.format.duration) : undefined,
        metadata: parsed as Prisma.InputJsonValue
      });
    });
  });
}

async function createPoster(videoPath: string, posterPath: string) {
  await ensureParent(posterPath);
  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-ss",
      "00:00:01.000",
      "-i",
      videoPath,
      "-vframes",
      "1",
      "-vf",
      "scale=1280:-1",
      posterPath
    ]);
    let stderr = "";
    ffmpeg.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code !== 0) return reject(new Error(stderr || "ffmpeg failed"));
      resolve();
    });
  });
}

async function processImage(mediaId: string, originalPath: string) {
  const image = sharp(originalPath, { failOnError: false });
  const metadata = await image.metadata();
  const thumb = mediaThumbPath(mediaId);
  await ensureParent(thumb);
  await image
    .rotate()
    .resize(900, 900, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 86, progressive: true })
    .toFile(thumb);
  return {
    width: metadata.width ?? undefined,
    height: metadata.height ?? undefined,
    thumbPath: thumb,
    posterPath: null,
    metadata: metadata as unknown as Prisma.InputJsonValue,
    duration: null
  };
}

async function processVideo(mediaId: string, originalPath: string) {
  const probe = await probeVideo(originalPath);
  const poster = mediaPosterPath(mediaId);
  await createPoster(originalPath, poster);
  const thumb = mediaThumbPath(mediaId);
  await ensureParent(thumb);
  await sharp(poster).resize(640, 640, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(thumb);
  return {
    width: probe.width,
    height: probe.height,
    thumbPath: thumb,
    posterPath: poster,
    metadata: probe.metadata ?? null,
    duration: probe.duration ?? null
  };
}

export async function processMediaJob(mediaId: string) {
  await ensureStorageRoots();
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) return;
  await prisma.media.update({ where: { id: mediaId }, data: { processingStatus: "PROCESSING", processingError: null } });
  try {
    const fileType = await fileTypeFromBuffer(await fs.readFile(media.storagePath));
    const isVideo = fileType?.mime.startsWith("video/") ?? media.mediaType === "VIDEO";
    const result = isVideo
      ? await processVideo(mediaId, media.storagePath)
      : await processImage(mediaId, media.storagePath);
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        width: result.width,
        height: result.height,
        duration: result.duration ?? undefined,
        thumbPath: result.thumbPath,
        posterPath: result.posterPath ?? undefined,
        metadata: result.metadata ?? Prisma.JsonNull,
        processingStatus: "READY",
        processingError: null,
        captureAt: media.captureAt ?? undefined
      }
    });
  } catch (error) {
    await prisma.media.update({
      where: { id: mediaId },
      data: { processingStatus: "FAILED", processingError: error instanceof Error ? error.message : "processing failed" }
    });
    throw error;
  }
}

export async function deleteMediaFiles(mediaId: string) {
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) return;
  await Promise.all([
    removeTree(path.dirname(media.storagePath)),
    media.thumbPath ? removeTree(path.dirname(media.thumbPath)) : Promise.resolve(),
    media.posterPath ? removeTree(path.dirname(media.posterPath)) : Promise.resolve()
  ]);
}
