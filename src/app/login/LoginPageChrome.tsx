"use client";

import { Suspense } from "react";
import { Moon, Sun } from "lucide-react";
import LoginForm from "@/app/login/LoginForm";
import { languageOptions, useI18n } from "@/shared/i18n";
import { themeOptions, useTheme } from "@/shared/theme";

export default function LoginPageChrome() {
  const { language, setLanguage, t } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-panel-head">
          <div>
            <p className="eyebrow">{t("app.brand")}</p>
            <h1>{t("app.loginTitle")}</h1>
          </div>
          <div className="login-panel-actions">
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
            <div className="theme-toggle" aria-label={t("theme.label")}>
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  className={theme === option.value ? "active" : ""}
                  onClick={() => setTheme(option.value)}
                  title={t(option.value === "light" ? "theme.light" : "theme.dark")}
                  type="button"
                >
                  {option.icon === "sun" ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Suspense fallback={<div className="empty-state">Loading</div>}>
          <LoginForm t={t} />
        </Suspense>
      </section>
    </main>
  );
}
