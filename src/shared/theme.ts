"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

export const themeStorageKey = "traceeverylink-theme";
export const defaultTheme: ThemeMode = "light";

export const themeOptions: Array<{ value: ThemeMode; icon: "sun" | "moon" }> = [
  { value: "light", icon: "sun" },
  { value: "dark", icon: "moon" }
];

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);

  useEffect(() => {
    const saved = window.localStorage.getItem(themeStorageKey);
    if (isThemeMode(saved)) {
      setThemeState(saved);
      applyTheme(saved);
      return;
    }
    applyTheme(defaultTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
  }, []);

  return { theme, setTheme };
}
