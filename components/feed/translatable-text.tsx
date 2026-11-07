"use client";

import { useState } from "react";
import { Languages, RotateCcw } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { translationService, normalizeLanguageCode } from "@/lib/translation/translation-service";

export function TranslatableText({
  text,
  sourceLanguage,
  className,
  as: Tag = "p",
}: {
  text: string;
  sourceLanguage?: string;
  className?: string;
  as?: "p" | "span" | "div" | "h1" | "h2" | "h3";
}) {
  const { language, t } = useLanguage();
  const { translationSettings } = useMarketplace();
  const [translated, setTranslated] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const source = normalizeLanguageCode(sourceLanguage);
  const target = language === "zh" ? "zh-CN" : "en";
  const canTranslate = translationSettings.enabled && translationSettings.provider !== "none" && source !== normalizeLanguageCode(target);
  const toggle = async () => {
    if (!canTranslate) return;
    if (translated) {
      setShowTranslation((value) => !value);
      return;
    }
    setLoading(true);
    setError("");
    const result = await translationService.translate(text, source, target);
    setLoading(false);
    if (result.translated) {
      setTranslated(result.text);
      setShowTranslation(true);
    } else {
      setError(result.error || t("feeds.translationFailed"));
    }
  };
  return (
    <div className="translatable-text">
      <Tag className={className}>{showTranslation && translated ? translated : text}</Tag>
      {canTranslate && (
        <button className="translation-toggle" type="button" onClick={toggle} disabled={loading}>
          {showTranslation ? <RotateCcw size={12} /> : <Languages size={12} />}
          {loading ? t("feeds.translating") : showTranslation ? t("feeds.showOriginal") : t("feeds.translate", { language: language === "zh" ? "中文" : "English" })}
        </button>
      )}
      {showTranslation && <small className="translation-label">{t("common.translated")}</small>}
      {error && <small className="translation-error" role="status">{error}</small>}
    </div>
  );
}
