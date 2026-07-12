export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireCsrfToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireCsrfToken(request);
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const job = await prisma.processingJob.update({
    where: { id },
    data: {
      status: "PENDING",
      lastError: null,
      runAfter: new Date()
    }
  });

  return NextResponse.json({ ok: true, job });
}
