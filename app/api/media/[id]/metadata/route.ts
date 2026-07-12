import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireCsrfToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  await requireCsrfToken(request);
  const { id } = await params;
  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim() || null;
  const description = String(form.get("description") ?? "").trim() || null;
  const captureAtRaw = String(form.get("captureAt") ?? "").trim();
  const albumId = String(form.get("albumId") ?? "").trim() || null;
  const favorite = String(form.get("favorite") ?? "") === "true";
  const albumOrderRaw = String(form.get("albumOrder") ?? "").trim();
  const tagList = String(form.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

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
        captureAt: captureAtRaw ? new Date(captureAtRaw) : null,
        albumId,
        favorite,
        albumOrder: albumOrderRaw ? Number(albumOrderRaw) : undefined
      }
    });
    await tx.mediaTag.deleteMany({ where: { mediaId: id } });
    if (tagRows.length > 0) {
      await tx.mediaTag.createMany({
        data: tagRows.map((tag) => ({ mediaId: id, tagId: tag.id }))
      });
    }
    return updated;
  });

  return NextResponse.json({ ok: true, media });
}
