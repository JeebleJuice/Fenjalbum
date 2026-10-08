import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireUser();
    const [queued, running, failed] = await Promise.all([
      prisma.processingJob.count({ where: { status: "PENDING" } }),
      prisma.processingJob.count({ where: { status: "RUNNING" } }),
      prisma.processingJob.count({ where: { status: "FAILED" } })
    ]);
    return NextResponse.json({ queued, running, failed });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
