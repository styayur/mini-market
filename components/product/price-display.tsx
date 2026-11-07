"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { formatMoney } from "@/lib/format";
import type { AtomicAmount } from "@/types/economy";

export function PriceDisplay({ amount, includeCurrency = true, className, fallback = "—" }: { amount?: AtomicAmount; includeCurrency?: boolean; className?: string; fallback?: string }) {
  const { economy, hydrated } = useMarketplace();
  const { language } = useLanguage();
  if (!amount) return <span className={className}>{fallback}</span>;
  return <span className={className}>{hydrated ? formatMoney(amount, economy, language, includeCurrency) : fallback}</span>;
}
