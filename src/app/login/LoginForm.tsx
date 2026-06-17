"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GitBranch, KeyRound, ShieldCheck } from "lucide-react";
import { translateLoginError, type Translate } from "@/shared/i18n";

export default function LoginForm({ t }: { t: Translate }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState(searchParams.get("error") || "");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, totp })
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error || "login.error.generic");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="login-stack">
      <form onSubmit={submit} className="login-form">
        <label>
          {t("login.email")}
          <input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        </label>
        <label>
          {t("login.password")}
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
          />
        </label>
        <label>
          {t("login.mfa")}
          <input
            value={totp}
            onChange={(event) => setTotp(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        </label>
        {error ? <p className="form-error">{translateLoginError(t, error)}</p> : null}
        <button className="primary-button" disabled={loading}>
          <KeyRound size={18} />
          {loading ? t("login.loading") : t("login.submit")}
        </button>
      </form>

      <div className="oauth-row" aria-label="OAuth login">
        <a href="/api/auth/oauth/cisco" title="Cisco SSO">
          <ShieldCheck size={18} />
          Cisco
        </a>
        <a href="/api/auth/oauth/google" title="Google">
          <span className="google-g">G</span>
          Google
        </a>
        <a href="/api/auth/oauth/github" title="GitHub">
          <GitBranch size={18} />
          GitHub
        </a>
      </div>
    </div>
  );
}
