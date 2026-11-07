import type { LanguagePreference, SupportedLanguage } from "@/types/marketplace";

export const SUPPORTED_LANGUAGES: Array<{ code: SupportedLanguage; label: string; nativeLabel: string }> = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "zh", label: "Simplified Chinese", nativeLabel: "简体中文" },
];

export const FALLBACK_LANGUAGE: SupportedLanguage = "en";

export function normalizeLanguage(value: string | null | undefined): SupportedLanguage | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase().replace("_", "-");
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  if (normalized === "zh" || normalized.startsWith("zh-")) return "zh";
  return undefined;
}

export function detectBrowserLanguage(languages: readonly string[] = []): SupportedLanguage {
  for (const language of languages) {
    const supported = normalizeLanguage(language);
    if (supported) return supported;
  }
  return FALLBACK_LANGUAGE;
}

export function resolveLanguage(input: {
  queryLanguage?: string | null;
  savedPreference?: string | null;
  browserLanguages?: readonly string[];
}): { language: SupportedLanguage; preference: LanguagePreference; source: "query" | "saved" | "browser" | "fallback" } {
  const query = normalizeLanguage(input.queryLanguage);
  if (query) return { language: query, preference: query, source: "query" };
  if (input.savedPreference === "auto") {
    return { language: detectBrowserLanguage(input.browserLanguages), preference: "auto", source: "browser" };
  }
  const saved = normalizeLanguage(input.savedPreference);
  if (saved) return { language: saved, preference: saved, source: "saved" };
  const browser = detectBrowserLanguage(input.browserLanguages);
  return { language: browser, preference: "auto", source: browser === FALLBACK_LANGUAGE ? "fallback" : "browser" };
}

export class LocalizationService {
  detect(queryLanguage?: string | null, savedPreference?: string | null, browserLanguages: readonly string[] = []): SupportedLanguage {
    return resolveLanguage({ queryLanguage, savedPreference, browserLanguages }).language;
  }

  isSupported(value: string | null | undefined): boolean {
    return normalizeLanguage(value) !== undefined;
  }

  localeFor(language: SupportedLanguage): string {
    return language === "zh" ? "zh-CN" : "en-US";
  }
}

export const localizationService = new LocalizationService();
