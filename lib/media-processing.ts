import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureStorageRoots, mediaPosterPath, mediaThumbPath, removeTree } from "@/lib/storage";
import { fileTypeFromPath } from "@/lib/file-signature";
import { env } from "@/lib/env";
import { perceptualHash } from "@/lib/perceptual-hash";

async function ensureParent(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function run(command: string, args: string[]) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(stderr || `${command} failed`)));
  });
}

function parseExifDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function extractMetadata(filePath: string) {
  try {
    const { stdout } = await run("exiftool", ["-json", "-n", "-DateTimeOriginal", "-CreateDate", "-MediaCreateDate", "-GPSLatitude", "-GPSLongitude", "-Orientation", filePath]);
    const row = (JSON.parse(stdout) as Array<Record<string, unknown>>)[0] ?? {};
    return {
      raw: row as Prisma.InputJsonValue,
      captureAt: parseExifDate(row.DateTimeOriginal ?? row.MediaCreateDate ?? row.CreateDate),
      latitude: typeof row.GPSLatitude === "number" ? row.GPSLatitude : null,
      longitude: typeof row.GPSLongitude === "number" ? row.GPSLongitude : null
    };
  } catch {
    return { raw: Prisma.JsonNull, captureAt: null, latitude: null, longitude: null };
  }
}

async function probeVideo(filePath: string) {
  return new Promise<{
    width?: number;
    height?: number;
    duration?: number;
    codecName?: string;
    metadata?: Prisma.InputJsonValue;
  }>((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,codec_name:format=duration",
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
        streams?: Array<{ width?: number; height?: number; codec_name?: string }>;
        format?: { duration?: string };
      };
      const stream = parsed.streams?.[0];
      resolve({
        width: stream?.width,
        height: stream?.height,
        duration: parsed.format?.duration ? Number(parsed.format.duration) : undefined,
        codecName: stream?.codec_name,
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
      "-threads",
      String(env.FFMPEG_THREADS),
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

async function processImage(mediaId: string, originalPath: string, mimeType: string) {
  let processPath = originalPath;
  let convertedPath: string | null = null;
  if (mimeType === "image/heic" || mimeType === "image/heif") {
    convertedPath = mediaThumbPath(mediaId, "converted-source.jpg");
    await ensureParent(convertedPath);
    await run("heif-convert", [originalPath, convertedPath]);
    processPath = convertedPath;
  }
  try {
    const image = sharp(processPath);
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
  } finally {
    if (convertedPath) await fs.rm(convertedPath, { force: true });
  }
}

async function processVideo(mediaId: string, originalPath: string, mimeType: string) {
  const probe = await probeVideo(originalPath);
  const poster = mediaPosterPath(mediaId);
  await createPoster(originalPath, poster);
  const thumb = mediaThumbPath(mediaId);
  await ensureParent(thumb);
  await sharp(poster).resize(640, 640, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(thumb);
  let playbackPath: string | null = null;
  if ((mimeType !== "video/mp4" && mimeType !== "video/webm") || (mimeType === "video/mp4" && probe.codecName !== "h264")) {
    playbackPath = mediaPosterPath(mediaId, "playback.mp4");
    await run("ffmpeg", ["-y", "-i", originalPath, "-map_metadata", "0", "-c:v", "libx264", "-preset", env.FFMPEG_PRESET, "-crf", "23", "-pix_fmt", "yuv420p", "-threads", String(env.FFMPEG_THREADS), "-c:a", "aac", "-movflags", "+faststart", playbackPath]);
  }
  return {
    width: probe.width,
    height: probe.height,
    thumbPath: thumb,
    posterPath: poster,
    metadata: probe.metadata ?? null,
    duration: probe.duration ?? null,
    playbackPath
  };
}

export async function processMediaJob(mediaId: string) {
  await ensureStorageRoots();
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) return;
  await prisma.media.update({ where: { id: mediaId }, data: { processingStatus: "PROCESSING", processingError: null } });
  try {
    const fileType = await fileTypeFromPath(media.storagePath);
    const isVideo = fileType?.mime.startsWith("video/") ?? media.mediaType === "VIDEO";
    const extracted = await extractMetadata(media.storagePath);
    const result = isVideo
      ? await processVideo(mediaId, media.storagePath, media.mimeType)
      : await processImage(mediaId, media.storagePath, media.mimeType);
    const visualHash = isVideo ? null : await perceptualHash(result.thumbPath);
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        width: result.width,
        height: result.height,
        duration: result.duration ?? undefined,
        thumbPath: result.thumbPath,
        posterPath: result.posterPath ?? undefined,
        playbackPath: "playbackPath" in result ? result.playbackPath : null,
        metadata: { technical: result.metadata ?? null, exif: extracted.raw } as Prisma.InputJsonValue,
        processingStatus: "READY",
        processingError: null,
        perceptualHash: visualHash,
        captureAt: media.captureAt ?? extracted.captureAt ?? undefined,
        latitude: extracted.latitude,
        longitude: extracted.longitude
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

export async function backfillNextPerceptualHash() {
  const media = await prisma.media.findFirst({
    where: {
      mediaType: "PHOTO",
      processingStatus: "READY",
      perceptualHash: null,
      thumbPath: { not: null },
      trashedAt: null
    },
    orderBy: [{ uploadedAt: "asc" }, { id: "asc" }]
  });
  if (!media?.thumbPath) return false;

  try {
    const hash = await perceptualHash(media.thumbPath);
    await prisma.media.updateMany({
      where: { id: media.id, perceptualHash: null },
      data: { perceptualHash: hash }
    });
  } catch (error) {
    console.warn(`Could not fingerprint ${media.id}:`, error instanceof Error ? error.message : error);
    await prisma.media.updateMany({
      where: { id: media.id, perceptualHash: null },
      data: { perceptualHash: "unavailable" }
    });
  }
  return true;
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
