import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireCsrfToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  await requireUser();
  const albums = await prisma.album.findMany({
    orderBy: { sortOrder: "asc" },
    include: { media: true }
  });
  return NextResponse.json({ albums });
}

export async function POST(request: NextRequest) {
  await requireUser();
  await requireCsrfToken(request);
  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim() || null;
  if (!title) return NextResponse.json({ error: "Album title required" }, { status: 400 });
  const album = await prisma.album.create({
    data: {
      title,
      description,
      sortOrder: await prisma.album.count()
    }
  });
  return NextResponse.json({ ok: true, album });
}
