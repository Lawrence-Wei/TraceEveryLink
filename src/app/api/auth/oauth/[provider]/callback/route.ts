import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionCookieOptions } from "@/server/auth";
import { SESSION_COOKIE } from "@/server/session";
import { completeOAuthLogin, isOAuthProviderKey } from "@/server/oauth";
import { getClientIp } from "@/server/request";
import { writeAudit } from "@/server/audit";

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  if (!isOAuthProviderKey(provider)) {
    return NextResponse.redirect(new URL("/login?error=oauth_unknown_provider", process.env.APP_URL || "http://localhost:3000"));
  }
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=oauth_cancelled", appUrl));
  }

  try {
    const { user, session } = await completeOAuthLogin({
      provider,
      code,
      state,
      userAgent: request.headers.get("user-agent"),
      ip: getClientIp(request)
    });
    const cookieStore = await cookies();
    cookieStore.set({
      ...sessionCookieOptions(session.expiresAt),
      name: SESSION_COOKIE,
      value: session.token
    });
    await writeAudit({
      actorId: user.id,
      action: `oauth_login_${provider}`,
      entityType: "user",
      entityId: user.id,
      ip: getClientIp(request)
    });
    return NextResponse.redirect(new URL("/", appUrl));
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth login failed";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, appUrl));
  }
}
