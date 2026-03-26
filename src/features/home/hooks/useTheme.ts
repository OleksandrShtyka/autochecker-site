"use client";

import { useEffect, useState } from "react";
import type { Theme } from "../types";

const STORAGE_KEY = "autochecker-theme";

function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    // fall back to OS preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {
    // SSR / storage blocked
  }
  return "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  // Hydrate from storage after mount
  useEffect(() => {
    const stored = readStoredTheme();
    setTheme(stored);
    document.documentElement.dataset.theme = stored;
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next: Theme = current === "light" ? "dark" : "light";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch { /* ignore */ }
      document.documentElement.dataset.theme = next;
      return next;
    });
  };

  return { theme, toggleTheme };
}
