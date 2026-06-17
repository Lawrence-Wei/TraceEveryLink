import { AuthProvider, Role } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/server/db";
import { createSession } from "@/server/auth";

export type OAuthProviderKey = "google" | "github" | "cisco";

type OAuthConfig = {
  provider: AuthProvider;
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl?: string;
  scopes: string[];
  supportsPkce: boolean;
};

type OAuthProfile = {
  providerAccountId: string;
  email: string;
  name: string;
};

const stateCookiePrefix = "patchplan_oauth_state_";

export function oauthStateCookie(provider: OAuthProviderKey) {
  return `${stateCookiePrefix}${provider}`;
}

export function isOAuthProviderKey(provider: string): provider is OAuthProviderKey {
  return provider === "google" || provider === "github" || provider === "cisco";
}

export async function getOAuthConfig(provider: OAuthProviderKey): Promise<OAuthConfig | null> {
  if (provider === "google") {
    return envConfig(AuthProvider.GOOGLE, {
      clientId: "GOOGLE_CLIENT_ID",
      clientSecret: "GOOGLE_CLIENT_SECRET",
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
      scopes: ["openid", "email", "profile"],
      supportsPkce: true
    });
  }

  if (provider === "github") {
    return envConfig(AuthProvider.GITHUB, {
      clientId: "GITHUB_CLIENT_ID",
      clientSecret: "GITHUB_CLIENT_SECRET",
      authorizationUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      userInfoUrl: "https://api.github.com/user",
      scopes: ["read:user", "user:email"],
      supportsPkce: false
    });
  }

  return getCiscoConfig();
}

export function redirectUri(provider: OAuthProviderKey) {
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/api/auth/oauth/${provider}/callback`;
}

export async function buildAuthorizationUrl(provider: OAuthProviderKey, config: OAuthConfig) {
  const state = randomBytes(24).toString("base64url");
  const codeVerifier = randomBytes(48).toString("base64url");
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri(provider),
    response_type: "code",
    scope: config.scopes.join(" "),
    state
  });

  if (config.supportsPkce) {
    params.set("code_challenge_method", "S256");
    params.set("code_challenge", pkceChallenge(codeVerifier));
  }

  const cookieStore = await cookies();
  cookieStore.set(oauthStateCookie(provider), JSON.stringify({ state, codeVerifier }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60
  });

  return `${config.authorizationUrl}?${params.toString()}`;
}

export async function completeOAuthLogin(input: {
  provider: OAuthProviderKey;
  code: string;
  state: string;
  userAgent?: string | null;
  ip?: string | null;
}) {
  const config = await getOAuthConfig(input.provider);
  if (!config) throw new Error("OAuth provider is not configured");

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(oauthStateCookie(input.provider))?.value;
  if (!stateCookie) throw new Error("OAuth state is missing");

  const parsed = JSON.parse(stateCookie) as { state: string; codeVerifier: string };
  if (parsed.state !== input.state) throw new Error("OAuth state mismatch");

  const token = await exchangeCode(input.provider, config, input.code, parsed.codeVerifier);
  const profile = await fetchProfile(input.provider, config, token.access_token);
  assertEmailAllowed(profile.email);

  const user = await upsertOAuthUser(config.provider, profile);
  const session = await createSession({
    userId: user.id,
    userAgent: input.userAgent,
    ip: input.ip
  });

  cookieStore.delete(oauthStateCookie(input.provider));
  return { user, session };
}

async function exchangeCode(
  provider: OAuthProviderKey,
  config: OAuthConfig,
  code: string,
  codeVerifier: string
) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: redirectUri(provider),
    grant_type: "authorization_code"
  });

  if (config.supportsPkce) body.set("code_verifier", codeVerifier);

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded"
    },
    body
  });
  const json = (await response.json()) as { access_token?: string; error?: string };
  if (!response.ok || !json.access_token) {
    throw new Error(json.error || `OAuth token exchange failed with ${response.status}`);
  }
  return json as { access_token: string };
}

async function fetchProfile(provider: OAuthProviderKey, config: OAuthConfig, accessToken: string) {
  if (provider === "github") {
    const userResponse = await fetch("https://api.github.com/user", {
      headers: { authorization: `Bearer ${accessToken}`, accept: "application/vnd.github+json" }
    });
    const user = (await userResponse.json()) as { id: number; login: string; name?: string; email?: string };
    let email = user.email;
    if (!email) {
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: { authorization: `Bearer ${accessToken}`, accept: "application/vnd.github+json" }
      });
      const emails = (await emailResponse.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      email = emails.find((item) => item.primary && item.verified)?.email || emails.find((item) => item.verified)?.email;
    }
    if (!email) throw new Error("GitHub account has no verified email");
    return {
      providerAccountId: String(user.id),
      email,
      name: user.name || user.login
    };
  }

  if (!config.userInfoUrl) throw new Error("UserInfo endpoint is missing");
  const response = await fetch(config.userInfoUrl, {
    headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" }
  });
  const profile = (await response.json()) as {
    sub?: string;
    id?: string;
    email?: string;
    name?: string;
    preferred_username?: string;
  };
  const providerAccountId = profile.sub || profile.id;
  if (!providerAccountId || !profile.email) throw new Error("OAuth profile is missing id or email");
  return {
    providerAccountId,
    email: profile.email,
    name: profile.name || profile.preferred_username || profile.email
  };
}

async function upsertOAuthUser(provider: AuthProvider, profile: OAuthProfile) {
  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId: profile.providerAccountId
      }
    },
    include: { user: true }
  });
  if (account) return account.user;

  let user = await prisma.user.findUnique({ where: { email: profile.email } });
  if (!user) {
    if ((process.env.OAUTH_AUTO_PROVISION || "true") !== "true") {
      throw new Error("OAuth auto provisioning is disabled");
    }
    user = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        passwordHash: "",
        role: Role.VIEWER,
        mfaEnabled: false
      }
    });
  }

  await prisma.account.create({
    data: {
      provider,
      providerAccountId: profile.providerAccountId,
      email: profile.email,
      userId: user.id
    }
  });
  return user;
}

async function getCiscoConfig() {
  const clientId = process.env.CISCO_CLIENT_ID || "";
  const clientSecret = process.env.CISCO_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) return null;

  let authorizationUrl = process.env.CISCO_AUTHORIZATION_URL || "";
  let tokenUrl = process.env.CISCO_TOKEN_URL || "";
  let userInfoUrl = process.env.CISCO_USERINFO_URL || "";

  if (process.env.CISCO_OIDC_ISSUER && (!authorizationUrl || !tokenUrl || !userInfoUrl)) {
    const issuer = process.env.CISCO_OIDC_ISSUER.replace(/\/$/, "");
    const response = await fetch(`${issuer}/.well-known/openid-configuration`);
    if (!response.ok) throw new Error("Cisco OIDC discovery failed");
    const discovery = (await response.json()) as {
      authorization_endpoint: string;
      token_endpoint: string;
      userinfo_endpoint: string;
    };
    authorizationUrl = authorizationUrl || discovery.authorization_endpoint;
    tokenUrl = tokenUrl || discovery.token_endpoint;
    userInfoUrl = userInfoUrl || discovery.userinfo_endpoint;
  }

  if (!authorizationUrl || !tokenUrl || !userInfoUrl) return null;

  return {
    provider: AuthProvider.CISCO,
    clientId,
    clientSecret,
    authorizationUrl,
    tokenUrl,
    userInfoUrl,
    scopes: ["openid", "email", "profile"],
    supportsPkce: true
  } satisfies OAuthConfig;
}

function envConfig(
  provider: AuthProvider,
  config: Omit<OAuthConfig, "provider" | "clientId" | "clientSecret"> & {
    clientId: string;
    clientSecret: string;
  }
) {
  const clientId = process.env[config.clientId] || "";
  const clientSecret = process.env[config.clientSecret] || "";
  if (!clientId || !clientSecret) return null;
  return {
    provider,
    clientId,
    clientSecret,
    authorizationUrl: config.authorizationUrl,
    tokenUrl: config.tokenUrl,
    userInfoUrl: config.userInfoUrl,
    scopes: config.scopes,
    supportsPkce: config.supportsPkce
  } satisfies OAuthConfig;
}

function pkceChallenge(codeVerifier: string) {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

function assertEmailAllowed(email: string) {
  const allowed = (process.env.ALLOWED_EMAIL_DOMAINS || "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.length) return;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain || !allowed.includes(domain)) {
    throw new Error("Email domain is not allowed");
  }
}
