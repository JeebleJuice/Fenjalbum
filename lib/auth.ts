import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { newToken } from "@/lib/security";
import { hashPassword, verifyPassword } from "@/lib/password";

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
};

const SESSION_COOKIE = "fenjalbum_session";
const CSRF_COOKIE = "fenjalbum_csrf";

function secretKey() {
  return new TextEncoder().encode(env.SESSION_SECRET);
}

export async function ensureBootstrapAdmin() {
  const count = await prisma.user.count();
  if (count === 0) {
    await prisma.user.create({
      data: {
        email: env.ADMIN_EMAIL,
        name: env.ADMIN_NAME,
        passwordHash: await hashPassword(env.ADMIN_PASSWORD),
        role: "ADMIN"
      }
    });
  }
}

export async function issueSession(user: { id: string; email: string; name: string; role: "ADMIN" | "USER"; tokenVersion: number }) {
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    tokenVersion: user.tokenVersion
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.APP_URL.startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  store.set(CSRF_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function ensureCsrfCookie() {
  const store = await cookies();
  let value = store.get(CSRF_COOKIE)?.value;
  if (!value) {
    value = newToken(24);
    store.set(CSRF_COOKIE, value, {
      httpOnly: false,
      sameSite: "lax",
      secure: env.APP_URL.startsWith("https://"),
      path: "/"
    });
  }
  return value;
}

export async function requireCsrfToken(request: Request) {
  const store = await cookies();
  const cookieToken = store.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get("x-csrf-token") ?? request.headers.get("csrf-token");
  const token = headerToken;
  if (!cookieToken || !token || cookieToken !== token) {
    throw new Error("Invalid CSRF token");
  }
}

export async function verifyAuthToken(token: string | undefined) {
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, secretKey());
    const userId = verified.payload.sub;
    if (!userId) return null;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tokenVersion !== Number(verified.payload.tokenVersion ?? 0)) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifyAuthToken(token);
}

export async function requireUser(): Promise<SafeUser> {
  await ensureBootstrapAdmin();
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export async function login(email: string, password: string) {
  await ensureBootstrapAdmin();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  await issueSession(user);
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function rotatePassword(userId: string, password: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(password),
      tokenVersion: { increment: 1 }
    }
  });
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getCsrfCookieName() {
  return CSRF_COOKIE;
}

export async function loginWithRateLimit(email: string, password: string) {
  return login(email, password);
}
