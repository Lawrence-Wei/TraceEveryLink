import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import {
  createSession,
  sessionCookieOptions,
  verifyPassword,
  verifyTotp
} from "@/server/auth";
import { SESSION_COOKIE } from "@/server/session";
import { checkRateLimit } from "@/server/rate-limit";
import { getClientIp, jsonError } from "@/server/request";
import { writeAudit } from "@/server/audit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totp: z.string().optional().default("")
});

export async function POST(request: Request) {
  const ip = getClientIp(request) || "unknown";
  const limited = checkRateLimit(`login:${ip}`);
  if (!limited.allowed) {
    return jsonError("Too many login attempts", 429);
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid login payload", 400);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    await writeAudit({
      action: "login_failed",
      entityType: "user",
      entityId: parsed.data.email,
      ip
    });
    return jsonError("Invalid credentials", 401);
  }

  if (user.mfaEnabled) {
    if (!user.mfaSecret || !parsed.data.totp || !(await verifyTotp(user.mfaSecret, parsed.data.totp))) {
      await writeAudit({
        actorId: user.id,
        action: "mfa_failed",
        entityType: "user",
        entityId: user.id,
        ip
      });
      return jsonError("Invalid MFA code", 401);
    }
  }

  const session = await createSession({
    userId: user.id,
    userAgent: request.headers.get("user-agent"),
    ip
  });

  const cookieStore = await cookies();
  cookieStore.set({
    ...sessionCookieOptions(session.expiresAt),
    name: SESSION_COOKIE,
    value: session.token
  });

  await writeAudit({
    actorId: user.id,
    action: "login",
    entityType: "user",
    entityId: user.id,
    ip
  });

  return Response.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    csrfToken: session.csrfToken
  });
}
