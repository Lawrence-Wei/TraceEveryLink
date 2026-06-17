import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { verify } from "otplib";
import type { Role, User } from "@prisma/client";
import { prisma } from "@/server/db";
import { hasRole } from "@/server/rbac";
import { getClientIp } from "@/server/request";
import { SESSION_COOKIE } from "@/server/session";

const SESSION_HOURS = 8;

export type SessionUser = Pick<User, "id" | "email" | "name" | "role">;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createToken() {
  return randomBytes(32).toString("base64url");
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function verifyTotp(secret: string, token: string) {
  const result = await verify({
    secret,
    token: token.replace(/\s+/g, ""),
    epochTolerance: 30
  });
  return result.valid;
}

export async function createSession(input: {
  userId: string;
  userAgent?: string | null;
  ip?: string | null;
}) {
  const token = createToken();
  const csrfToken = createToken();
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: input.userId,
      tokenHash: hashToken(token),
      csrfToken,
      userAgent: input.userAgent ?? null,
      ip: input.ip ?? null,
      expiresAt
    }
  });

  return { token, csrfToken, expiresAt };
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashToken(token),
      expiresAt: { gt: new Date() }
    },
    include: {
      user: {
        select: { id: true, email: true, name: true, role: true }
      }
    }
  });

  return session;
}

export async function requirePageSession(roles?: Role[]) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (roles && !hasRole(session.user.role, roles)) redirect("/");
  return session;
}

export async function authenticateRequest(
  request: Request,
  options: { roles?: Role[]; csrf?: boolean } = {}
) {
  const token = readCookie(request.headers.get("cookie") || "", SESSION_COOKIE);
  if (!token) {
    return { ok: false as const, status: 401, error: "Authentication required" };
  }

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashToken(token),
      expiresAt: { gt: new Date() }
    },
    include: {
      user: {
        select: { id: true, email: true, name: true, role: true }
      }
    }
  });

  if (!session) {
    return { ok: false as const, status: 401, error: "Session expired" };
  }

  if (options.roles && !hasRole(session.user.role, options.roles)) {
    return { ok: false as const, status: 403, error: "Permission denied" };
  }

  if (options.csrf) {
    const csrfHeader = request.headers.get("x-csrf-token");
    if (!csrfHeader || csrfHeader !== session.csrfToken) {
      return { ok: false as const, status: 403, error: "Invalid CSRF token" };
    }
  }

  return { ok: true as const, session };
}

export async function getRequestContext() {
  const headerStore = await headers();
  return {
    userAgent: headerStore.get("user-agent"),
    ip: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip")
  };
}

export async function revokeRequestSession(request: Request) {
  const token = readCookie(request.headers.get("cookie") || "", SESSION_COOKIE);
  if (!token) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  };
}

export function getIpForAudit(request: Request) {
  return getClientIp(request);
}

function readCookie(header: string, name: string) {
  const cookies = header.split(";").map((part) => part.trim());
  const match = cookies.find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}
