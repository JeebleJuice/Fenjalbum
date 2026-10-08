import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/api/auth/csrf", "/api/health"];
const STATIC_PREFIXES = ["/_next", "/favicon.ico", "/robots.txt", "/sitemap.xml", "/manifest.webmanifest", "/icons", "/sw.js"];

function isProtected(pathname: string) {
  if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return false;
  return !PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

async function hasValidToken(request: NextRequest) {
  const token = request.cookies.get("fenjalbum_session")?.value;
  if (!token || !process.env.SESSION_SECRET) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const responseHeaders = new Headers();
  responseHeaders.set("X-Frame-Options", "DENY");
  responseHeaders.set("X-Content-Type-Options", "nosniff");
  responseHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
  responseHeaders.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  responseHeaders.set("Content-Security-Policy", ["default-src 'self'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "img-src 'self' data: blob: https://tile.openstreetmap.org", "media-src 'self' blob:", "style-src 'self' 'unsafe-inline'", "script-src 'self' 'unsafe-inline' 'unsafe-eval'", "connect-src 'self'", "font-src 'self' data:"].join("; "));

  if (!isProtected(pathname)) return NextResponse.next({ headers: responseHeaders });
  if (!(await hasValidToken(request))) {
    if (pathname.startsWith("/api")) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: responseHeaders });
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  return NextResponse.next({ headers: responseHeaders });
}

// The upload route authenticates and limits concurrent work itself. It must bypass Proxy because
// Next.js clones and buffers proxied request bodies (10 MB by default), which truncates
// larger streamed video uploads before Busboy receives the closing multipart boundary.
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/upload).*)"] };
