import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireCsrfToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  await requireCsrfToken(request);
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { mediaIds?: string[] } | null;
  const mediaIds = body?.mediaIds?.map((value) => String(value).trim()).filter(Boolean) ?? [];
  if (!mediaIds.length) {
    return NextResponse.json({ error: "No media selected" }, { status: 400 });
  }

  const result = await prisma.media.updateMany({
    where: { id: { in: mediaIds } },
    data: { albumId: id }
  });

  return NextResponse.json({ ok: true, updated: result.count });
}
