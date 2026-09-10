"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Language, MessageKey } from "@/lib/i18n";
import { translate } from "@/lib/i18n";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: MessageKey, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const LANGUAGE_KEY = "mini-market-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(LANGUAGE_KEY);
    const timer = window.setTimeout(() => {
      if (saved === "zh") setLanguageState("zh");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.documentElement.dataset.language = language;
    window.localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  const setLanguage = (next: Language) => setLanguageState(next);
  const value: LanguageContextValue = {
    language,
    setLanguage,
    toggleLanguage: () => setLanguageState((current) => current === "en" ? "zh" : "en"),
    t: (key, variables) => translate(language, key, variables),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
