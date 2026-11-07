"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Language, MessageKey } from "@/lib/i18n";
import { translate } from "@/lib/i18n";
import type { LanguagePreference, SupportedLanguage } from "@/types/marketplace";
import { detectBrowserLanguage, resolveLanguage } from "@/lib/localization-service";

interface LanguageContextValue {
  language: Language;
  preference: LanguagePreference;
  ready: boolean;
  setLanguage: (language: Language) => void;
  setPreference: (preference: LanguagePreference) => void;
  toggleLanguage: () => void;
  t: (key: MessageKey, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
export const LANGUAGE_STORAGE_KEY = "fitimart-language";
export const LEGACY_LANGUAGE_STORAGE_KEY = "mini-market-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [preference, setPreferenceState] = useState<LanguagePreference>("auto");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let queryLanguage: string | null = null;
    let saved: string | null = null;
    try {
      queryLanguage = new URLSearchParams(window.location.search).get("lang");
      saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
    } catch {
      // Session language still works without storage.
    }
    const timer = window.setTimeout(() => {
      const resolved = resolveLanguage({
        queryLanguage,
        savedPreference: queryLanguage ? null : saved,
        browserLanguages: navigator.languages?.length ? navigator.languages : [navigator.language],
      });
      setLanguageState(resolved.language);
      setPreferenceState(resolved.preference);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.documentElement.dataset.language = language;
    document.documentElement.dataset.languagePreference = preference;
    if (ready) {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, preference);
        window.localStorage.removeItem(LEGACY_LANGUAGE_STORAGE_KEY);
      } catch {
        // Session language still works.
      }
    }
  }, [language, preference, ready]);

  const setLanguage = (next: SupportedLanguage) => {
    setLanguageState(next);
    setPreferenceState(next);
  };

  const setPreference = (next: LanguagePreference) => {
    setPreferenceState(next);
    if (next === "auto") {
      const browser = detectBrowserLanguage(navigator.languages?.length ? navigator.languages : [navigator.language]);
      setLanguageState(browser);
      return;
    }
    setLanguageState(next);
  };

  const value: LanguageContextValue = {
    language,
    preference,
    ready,
    setLanguage,
    setPreference,
    toggleLanguage: () => setLanguage(language === "en" ? "zh" : "en"),
    t: (key, variables) => translate(language, key, variables),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
