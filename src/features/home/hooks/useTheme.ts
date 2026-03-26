"use client";

import { useEffect } from "react";
import type { Theme } from "../types";

const STORAGE_KEY = "autochecker-theme";

export function useTheme(initialTheme: Theme = "light") {
  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    window.localStorage.setItem(STORAGE_KEY, "light");
  }, []);

  return {
    theme: initialTheme,
    toggleTheme: () => {},
  };
}
