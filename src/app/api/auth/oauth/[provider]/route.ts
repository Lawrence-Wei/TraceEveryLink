import { NextResponse } from "next/server";
import { buildAuthorizationUrl, getOAuthConfig, isOAuthProviderKey } from "@/server/oauth";

export async function GET(
  _request: Request,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  if (!isOAuthProviderKey(provider)) {
    return NextResponse.redirect(new URL("/login?error=oauth_unknown_provider", process.env.APP_URL || "http://localhost:3000"));
  }
  const config = await getOAuthConfig(provider);
  if (!config) {
    return NextResponse.redirect(new URL("/login?error=oauth_not_configured", process.env.APP_URL || "http://localhost:3000"));
  }
  const authorizationUrl = await buildAuthorizationUrl(provider, config);
  return NextResponse.redirect(authorizationUrl);
}
