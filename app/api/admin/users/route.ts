import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireCsrfToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  await requireAdmin();
  await requireCsrfToken(request);
  const body = (await request.json().catch(() => null)) as { name?: string; email?: string; password?: string; role?: string } | null;
  const name = body?.name?.trim() ?? "";
  const email = body?.email?.trim().toLowerCase() ?? "";
  if (name.length < 2 || !email.includes("@") || (body?.password?.length ?? 0) < 10) return NextResponse.json({ error: "Use a valid name, email, and password of at least 10 characters." }, { status: 400 });
  if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ error: "That email already has an account." }, { status: 409 });
  await prisma.user.create({ data: { name, email, passwordHash: await hashPassword(body!.password!), role: body?.role === "ADMIN" ? "ADMIN" : "USER" } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
