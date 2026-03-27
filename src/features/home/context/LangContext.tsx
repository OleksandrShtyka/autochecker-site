"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type Lang = "en" | "uk";

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Nav
    nav_top:        "Overview",
    nav_features:   "Features",
    nav_security:   "Security",
    nav_social:     "Social",
    nav_about:      "About",
    nav_signin:     "Sign In",
    nav_install:    "Install",
    nav_dashboard:  "Dashboard",
    nav_settings:   "Settings",
    nav_admin:      "Admin",
    nav_signout:    "Sign out",

    // Hero
    hero_cta:       "Install AutoChecker",
    hero_sub:       "Free VS Code extension · 61 commands · 0 dependencies",
    hero_download:  "🏋️ Download Fitness Tracker for Android",

    // CTA section
    cta_title:      "Ready to code better?",
    cta_sub:        "Join developers already using AutoChecker to speed up their workflow.",
    cta_btn:        "Install Free",
    cta_mobile:     "🏋️ Download Fitness Tracker for Android",

    // Features
    feat_title:     "Everything you need",
    feat_sub:       "12 feature groups, 61 commands, zero external dependencies.",

    // Stats
    stats_commands: "Commands",
    stats_deps:     "Dependencies",
    stats_size:     "Package Size",
    stats_groups:   "Feature Groups",

    // Security
    sec_title:      "Security first",
    sec_sub:        "Built with security in mind at every layer.",
  },
  uk: {
    // Nav
    nav_top:        "Огляд",
    nav_features:   "Можливості",
    nav_security:   "Безпека",
    nav_social:     "Соціальні мережі",
    nav_about:      "Про нас",
    nav_signin:     "Увійти",
    nav_install:    "Встановити",
    nav_dashboard:  "Кабінет",
    nav_settings:   "Налаштування",
    nav_admin:      "Адмін",
    nav_signout:    "Вийти",

    // Hero
    hero_cta:       "Встановити AutoChecker",
    hero_sub:       "Безкоштовне розширення VS Code · 61 команда · 0 залежностей",
    hero_download:  "🏋️ Завантажити Fitness Tracker для Android",

    // CTA section
    cta_title:      "Готові кодити краще?",
    cta_sub:        "Приєднуйтесь до розробників, що вже використовують AutoChecker.",
    cta_btn:        "Встановити безкоштовно",
    cta_mobile:     "🏋️ Завантажити Fitness Tracker для Android",

    // Features
    feat_title:     "Все що потрібно",
    feat_sub:       "12 груп функцій, 61 команда, нуль зовнішніх залежностей.",

    // Stats
    stats_commands: "Команди",
    stats_deps:     "Залежності",
    stats_size:     "Розмір пакету",
    stats_groups:   "Групи функцій",

    // Security
    sec_title:      "Безпека перш за все",
    sec_sub:        "Безпека враховується на кожному рівні.",
  },
};

const LangContext = createContext<LangCtx>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("lang") as Lang | null;
    if (stored === "en" || stored === "uk") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  const t = (key: string): string =>
    translations[lang]?.[key] ?? translations.en[key] ?? key;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
