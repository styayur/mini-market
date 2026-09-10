"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

export function LanguageToggle() {
  const { language, toggleLanguage, t } = useLanguage();
  return (
    <button className="language-toggle" type="button" onClick={toggleLanguage} aria-label={t("nav.language")} title={t("nav.language")}>
      <Languages size={15} />
      <span>{language === "en" ? "中文" : "EN"}</span>
    </button>
  );
}
