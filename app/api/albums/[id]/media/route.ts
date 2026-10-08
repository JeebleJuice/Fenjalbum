import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireCsrfToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { explicitDateBounds } from "@/lib/date-search";
import { buildMediaOrderBy, buildMediaWhere, type GalleryFilters } from "@/lib/filters";

const PICKER_PAGE_SIZE = 48;

function pickerThumb(media: { id: string; mediaType: "PHOTO" | "VIDEO"; thumbPath: string | null; processingStatus: "PENDING" | "PROCESSING" | "READY" | "FAILED" }) {
  if (media.mediaType === "PHOTO") {
    return media.thumbPath && media.processingStatus === "READY" ? `/api/media/${media.id}?variant=thumb` : `/api/media/${media.id}`;
  }
  return media.processingStatus === "READY" && media.thumbPath ? `/api/media/${media.id}?variant=thumb` : null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const query = request.nextUrl.searchParams;
  const requestedPage = Math.max(1, Number(query.get("page") ?? "1") || 1);
  const dates = explicitDateBounds(query.get("dateFrom") ?? undefined, query.get("dateTo") ?? undefined);
  const requestedType = query.get("mediaType");
  const filters: GalleryFilters = {
    q: query.get("q")?.trim() || undefined,
    mediaType: requestedType === "photo" || requestedType === "video" ? requestedType : "all",
    captureFrom: dates.from,
    captureTo: dates.to,
    sort: "newest"
  };
  const where = { AND: [buildMediaWhere(filters), { albums: { none: { albumId: id } } }] };
  const total = await prisma.media.count({ where });
  if (query.get("selection") === "all") {
    const matches = await prisma.media.findMany({ where, select: { id: true }, orderBy: buildMediaOrderBy(filters) });
    return NextResponse.json({ ids: matches.map((item) => item.id), total });
  }
  const totalPages = Math.max(1, Math.ceil(total / PICKER_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const media = await prisma.media.findMany({
    where,
    include: { albums: { include: { album: true }, orderBy: { addedAt: "asc" } } },
    orderBy: buildMediaOrderBy(filters),
    skip: (page - 1) * PICKER_PAGE_SIZE,
    take: PICKER_PAGE_SIZE
  });

  return NextResponse.json({
    items: media.map((item) => ({
      id: item.id,
      title: item.title,
      originalFilename: item.originalFilename,
      mediaType: item.mediaType,
      thumbSrc: pickerThumb(item),
      captureAt: item.captureAt?.toISOString() ?? null,
      uploadedAt: item.uploadedAt.toISOString(),
      albumTitle: item.albums.map((membership) => membership.album.title).join(", ") || null,
      processingStatus: item.processingStatus
    })),
    page,
    pageSize: PICKER_PAGE_SIZE,
    total,
    totalPages
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  await requireCsrfToken(request);
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { mediaIds?: string[] } | null;
  const mediaIds = body?.mediaIds?.map((value) => String(value).trim()).filter(Boolean) ?? [];
  if (!mediaIds.length) {
    return NextResponse.json({ error: "No media selected" }, { status: 400 });
  }

  const existing = await prisma.media.findMany({
    where: { id: { in: mediaIds }, trashedAt: null },
    select: { id: true }
  });
  const result = await prisma.albumMedia.createMany({
    data: existing.map((media) => ({ albumId: id, mediaId: media.id })),
    skipDuplicates: true
  });

  return NextResponse.json({ ok: true, added: result.count });
}
