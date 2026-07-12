import { NextResponse } from "next/server";
import { ensureCsrfCookie, getCsrfCookieName } from "@/lib/auth";

export async function GET() {
  const token = await ensureCsrfCookie();
  return NextResponse.json({ csrf: token, cookie: getCsrfCookieName() });
}
