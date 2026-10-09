import { NextRequest } from "next/server";
import { createReadStream, statSync } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";
import { prisma } from "@/lib/db";
import { parseRangeHeader } from "@/lib/range";
import { requireAdmin, requireCsrfToken, requireUser } from "@/lib/auth";
import { deleteMediaFiles } from "@/lib/media-processing";

export const runtime = "nodejs";

function responseForFile(filePath: string, contentType: string, download = false, rangeHeader: string | null = null) {
  const stat = statSync(filePath);
  const range = contentType.startsWith("video/") ? parseRangeHeader(rangeHeader, stat.size) : null;
  const headers = new Headers({
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
    "Content-Length": String(range ? range.end - range.start + 1 : stat.size)
  });
  if (download) {
    headers.set("Content-Disposition", `attachment; filename="${path.basename(filePath)}"`);
  }
  if (range) {
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${stat.size}`);
    headers.set("Content-Length", String(range.end - range.start + 1));
    return new Response(Readable.toWeb(createReadStream(filePath, { start: range.start, end: range.end })) as ReadableStream<Uint8Array>, { status: 206, headers });
  }
  return new Response(Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>, { headers });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return new Response("Not found", { status: 404 });
  const variant = request.nextUrl.searchParams.get("variant") ?? "original";
  const download = request.nextUrl.searchParams.get("download") === "1";
  const filePath = variant === "thumb" ? media.thumbPath : variant === "poster" ? media.posterPath ?? media.thumbPath : variant === "playback" ? media.playbackPath ?? media.storagePath : media.storagePath;
  if (!filePath) return new Response("Not found", { status: 404 });
  const contentType = variant === "thumb" || variant === "poster" ? "image/jpeg" : variant === "playback" && media.playbackPath ? "video/mp4" : media.mimeType;
  return responseForFile(filePath, contentType, download, request.headers.get("range"));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  await requireCsrfToken(request);
  const { id } = await params;
  if (request.nextUrl.searchParams.get("permanent") !== "1") {
    await prisma.media.update({ where: { id }, data: { trashedAt: new Date() } });
    return Response.json({ ok: true, trashed: true });
  }
  await deleteMediaFiles(id);
  await prisma.media.delete({ where: { id } });
  return Response.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  await requireCsrfToken(request);
  const { id } = await params;
  await prisma.media.update({ where: { id }, data: { trashedAt: null } });
  return Response.json({ ok: true });
}
