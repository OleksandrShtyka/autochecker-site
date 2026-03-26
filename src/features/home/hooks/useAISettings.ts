"use client";

import { useCallback, useEffect, useState } from "react";

export type AITone = "friendly" | "professional" | "technical" | "brief";
export type AILanguage = "auto" | "uk" | "en" | "ru" | "pl" | "de" | "fr" | "es";

export type AISettings = {
  enabled: boolean;
  name: string;
  language: AILanguage;
  tone: AITone;
};

const DEFAULTS: AISettings = {
  enabled: true,
  name: "Helper AI",
  language: "auto",
  tone: "friendly",
};

const KEY = "ai_settings";

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(DEFAULTS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<AISettings>) });
    } catch {}
    setMounted(true);
  }, []);

  const update = useCallback((patch: Partial<AISettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { settings, update, mounted };
}
