export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireCsrfToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { hashPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  await requireCsrfToken(request);
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!body.currentPassword || !body.newPassword) {
    return NextResponse.json({ error: "Missing password fields" }, { status: 400 });
  }

  if (body.newPassword.length < 12) {
    return NextResponse.json({ error: "New password must be at least 12 characters" }, { status: 400 });
  }

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const valid = await verifyPassword(body.currentPassword, fullUser.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(body.newPassword),
      tokenVersion: { increment: 1 }
    }
  });

  return NextResponse.json({ ok: true });
}
