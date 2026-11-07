import type { AtomicAmount, EconomySettings } from "@/types/economy";
import { formatAtomicMoney } from "./money.ts";

export function formatMoney(
  value: AtomicAmount,
  economy: EconomySettings,
  language: "en" | "zh",
  includeCurrency = true,
): string {
  return formatAtomicMoney(value, economy, {
    locale: language === "zh" ? "zh-CN" : "en-US",
    includeCurrency,
  });
}

export function formatCompactNumber(value: number, language: "en" | "zh" = "en") {
  return new Intl.NumberFormat(language === "zh" ? "zh-CN" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(value: number, language: "en" | "zh" = "en") {
  return new Intl.NumberFormat(language === "zh" ? "zh-CN" : "en-US").format(value);
}

export function formatDate(value: string, language: "en" | "zh" = "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string, language: "en" | "zh" = "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
