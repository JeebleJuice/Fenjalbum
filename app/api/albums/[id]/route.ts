import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireCsrfToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await prisma.album.findUnique({
    where: { id },
    include: { media: { orderBy: { albumOrder: "asc" }, include: { tags: { include: { tag: true } } } } }
  });
  if (!album) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ album });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  await requireCsrfToken(request);
  const { id } = await params;
  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim() || null;
  const coverMediaId = String(form.get("coverMediaId") ?? "").trim() || null;
  const album = await prisma.album.update({
    where: { id },
    data: { title, description, coverMediaId }
  });
  return NextResponse.json({ ok: true, album });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  await requireCsrfToken(request);
  const { id } = await params;
  await prisma.$transaction([
    prisma.media.updateMany({ where: { albumId: id }, data: { albumId: null } }),
    prisma.album.delete({ where: { id } })
  ]);
  return NextResponse.json({ ok: true });
}
