import { NextRequest, NextResponse } from "next/server";
import { clearSession, requireCsrfToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  await requireCsrfToken(request);
  await clearSession();
  return NextResponse.json({ ok: true });
}
