"use client";

import { useEffect, useState } from "react";
import type { Theme } from "../types";

const STORAGE_KEY = "autochecker-theme";

export function useTheme(initialTheme: Theme = "light") {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  return { theme, toggleTheme };
}
