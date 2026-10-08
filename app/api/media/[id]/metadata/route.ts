import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireCsrfToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  await requireCsrfToken(request);
  const { id } = await params;
  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim() || null;
  const description = String(form.get("description") ?? "").trim() || null;
  const captureAtRaw = String(form.get("captureAt") ?? "").trim();
  const albumIds = Array.from(new Set(form.getAll("albumIds").map((value) => String(value).trim()).filter(Boolean)));
  const favorite = String(form.get("favorite") ?? "") === "true";
  const tagList = String(form.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  const captureAt = captureAtRaw ? new Date(captureAtRaw) : null;
  if (captureAt && Number.isNaN(captureAt.getTime())) {
    return NextResponse.json({ error: "Capture date is not valid." }, { status: 400 });
  }
  const tagRows = await Promise.all(
    tagList.map((name) =>
      prisma.tag.upsert({
        where: { slug: name.replace(/[^a-z0-9]+/g, "-") },
        update: { name },
        create: { name, slug: name.replace(/[^a-z0-9]+/g, "-") }
      })
    )
  );

  const media = await prisma.$transaction(async (tx) => {
    const updated = await tx.media.update({
      where: { id },
      data: {
        title,
        description,
        captureAt,
        favorite
      }
    });
    await tx.albumMedia.deleteMany({
      where: albumIds.length > 0
        ? { mediaId: id, albumId: { notIn: albumIds } }
        : { mediaId: id }
    });
    if (albumIds.length > 0) {
      await tx.albumMedia.createMany({
        data: albumIds.map((albumId) => ({ albumId, mediaId: id })),
        skipDuplicates: true
      });
    }
    await tx.mediaTag.deleteMany({ where: { mediaId: id } });
    if (tagRows.length > 0) {
      await tx.mediaTag.createMany({
        data: tagRows.map((tag) => ({ mediaId: id, tagId: tag.id }))
      });
    }
    return updated;
  });

  return NextResponse.json({ ok: true, id: media.id });
}
