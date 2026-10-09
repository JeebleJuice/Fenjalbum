import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireCsrfToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { perceptualHashDistance } from "@/lib/perceptual-hash";

export async function POST(request: NextRequest) {
  await requireAdmin();
  await requireCsrfToken(request);
  const body = (await request.json().catch(() => null)) as { duplicateId?: string; keeperId?: string } | null;
  const duplicateId = body?.duplicateId?.trim();
  const keeperId = body?.keeperId?.trim();
  if (!duplicateId || !keeperId || duplicateId === keeperId) {
    return NextResponse.json({ error: "Choose two different photos." }, { status: 400 });
  }

  const [duplicate, keeper] = await Promise.all([
    prisma.media.findFirst({
      where: { id: duplicateId, mediaType: "PHOTO", trashedAt: null },
      include: { albums: true, tags: true }
    }),
    prisma.media.findFirst({
      where: { id: keeperId, mediaType: "PHOTO", trashedAt: null },
      include: { albums: true, tags: true }
    })
  ]);
  if (!duplicate || !keeper) return NextResponse.json({ error: "One of the photos no longer exists." }, { status: 404 });

  const distance = duplicate.perceptualHash && keeper.perceptualHash
    ? perceptualHashDistance(duplicate.perceptualHash, keeper.perceptualHash)
    : Number.POSITIVE_INFINITY;
  if (duplicate.captureAt || !keeper.captureAt || distance > 5) {
    return NextResponse.json({ error: "These photos no longer qualify as a safe undated duplicate pair." }, { status: 409 });
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.albumMedia.createMany({
      data: duplicate.albums.map((membership) => ({
        albumId: membership.albumId,
        mediaId: keeper.id,
        albumOrder: membership.albumOrder
      })),
      skipDuplicates: true
    });
    await transaction.mediaTag.createMany({
      data: duplicate.tags.map((relation) => ({ mediaId: keeper.id, tagId: relation.tagId })),
      skipDuplicates: true
    });
    await transaction.album.updateMany({
      where: { coverMediaId: duplicate.id },
      data: { coverMediaId: keeper.id }
    });
    await transaction.media.update({
      where: { id: keeper.id },
      data: {
        favorite: keeper.favorite || duplicate.favorite,
        title: keeper.title ?? duplicate.title,
        description: keeper.description ?? duplicate.description,
        latitude: keeper.latitude ?? duplicate.latitude,
        longitude: keeper.longitude ?? duplicate.longitude
      }
    });
    await transaction.media.update({
      where: { id: duplicate.id },
      data: { trashedAt: new Date() }
    });
  });

  return NextResponse.json({ ok: true, keeperId: keeper.id, trashedId: duplicate.id });
}
