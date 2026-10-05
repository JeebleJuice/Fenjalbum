import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireCsrfToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  await requireCsrfToken(request);
  const { id } = await params;
  const media = await prisma.media.update({ where: { id }, data: { favorite: true } });
  return NextResponse.json({ ok: true, favorite: media.favorite });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  await requireCsrfToken(request);
  const { id } = await params;
  await prisma.media.update({ where: { id }, data: { favorite: false } });
  return NextResponse.json({ ok: true });
}
