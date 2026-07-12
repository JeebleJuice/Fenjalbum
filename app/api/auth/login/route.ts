import { NextRequest, NextResponse } from "next/server";
import { login, requireCsrfToken } from "@/lib/auth";
import { env } from "@/lib/env";
import { getClientIp, isSafeRedirect, rateLimit } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    await requireCsrfToken(request);
    const ip = getClientIp(request.headers);
    const limited = rateLimit(`login:${ip}`, env.RATE_LIMIT_LOGIN_MAX);
    if (!limited.allowed) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }
    const body = (await request.json()) as { email?: string; password?: string; next?: string };
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }
    const result = await login(body.email, body.password);
    if (!result) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    const response = NextResponse.json({
      ok: true,
      next: isSafeRedirect(body.next) ? body.next : "/"
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Login failed" }, { status: 400 });
  }
}
