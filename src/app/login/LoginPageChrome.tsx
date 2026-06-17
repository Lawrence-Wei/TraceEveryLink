"use client";

import { Suspense } from "react";
import LoginForm from "@/app/login/LoginForm";
import { languageOptions, useI18n } from "@/shared/i18n";

export default function LoginPageChrome() {
  const { language, setLanguage, t } = useI18n();

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-panel-head">
          <div>
            <p className="eyebrow">{t("app.brand")}</p>
            <h1>{t("app.loginTitle")}</h1>
          </div>
          <div className="language-toggle" aria-label={t("language.label")}>
            {languageOptions.map((option) => (
              <button
                key={option.value}
                className={language === option.value ? "active" : ""}
                onClick={() => setLanguage(option.value)}
                type="button"
              >
                {option.shortLabel}
              </button>
            ))}
          </div>
        </div>
        <Suspense fallback={<div className="empty-state">Loading</div>}>
          <LoginForm t={t} />
        </Suspense>
      </section>
    </main>
  );
}
