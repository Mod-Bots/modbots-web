"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemeMode = "light" | "dark" | "system" | "auto";
type ResolvedTheme = "light" | "dark";

const storageKey = "modbots.theme-mode";
const dayStartsAt = 6;
const nightStartsAt = 18;

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === "light" ||
  value === "dark" ||
  value === "system" ||
  value === "auto";

const storedThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "system";
  }

  const stored = window.localStorage.getItem(storageKey);
  return isThemeMode(stored) ? stored : "system";
};

const resolveTheme = (mode: ThemeMode): ResolvedTheme => {
  if (mode === "light" || mode === "dark") {
    return mode;
  }

  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  const hour = new Date().getHours();
  return hour >= dayStartsAt && hour < nightStartsAt ? "light" : "dark";
};

const applyTheme = (mode: ThemeMode) => {
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.dataset.theme = resolveTheme(mode);
};

interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(storedThemeMode);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    window.localStorage.setItem(storageKey, mode);
    applyTheme(mode);
  }, []);

  useEffect(() => {
    applyTheme(themeMode);

    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const updateTheme = () => applyTheme(themeMode);

    if (themeMode === "system") {
      systemTheme.addEventListener("change", updateTheme);
    }

    const autoTimer =
      themeMode === "auto"
        ? window.setInterval(updateTheme, 60_000)
        : undefined;

    return () => {
      systemTheme.removeEventListener("change", updateTheme);
      if (autoTimer !== undefined) {
        window.clearInterval(autoTimer);
      }
    };
  }, [themeMode]);

  useEffect(() => {
    const syncTheme = (event: StorageEvent) => {
      if (event.key === storageKey && isThemeMode(event.newValue)) {
        setThemeModeState(event.newValue);
        applyTheme(event.newValue);
      }
    };

    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
