"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import type { LanguagePreference } from "@/types/marketplace";

export function LanguageToggle() {
  const { preference, setPreference, t } = useLanguage();
  return (
    <label className="language-toggle" title={t("nav.language")}>
      <Languages size={15} aria-hidden="true" />
      <span className="sr-only">{t("nav.language")}</span>
      <select
        aria-label={t("nav.language")}
        value={preference}
        onChange={(event) => setPreference(event.target.value as LanguagePreference)}
      >
        <option value="auto">{t("settings.languageAuto")}</option>
        <option value="en">English</option>
        <option value="zh">简体中文</option>
      </select>
    </label>
  );
}
