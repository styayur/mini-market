"use client";

import { Heart } from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { useLanguage } from "@/components/providers/language-provider";

export function FavoriteButton({ productId, label = true, className = "" }: { productId: string; label?: boolean; className?: string }) {
  const { favoriteProductIds, toggleFavorite } = useMarketplace();
  const { t } = useLanguage();
  const active = favoriteProductIds.includes(productId);
  return (
    <button type="button" className={`icon-button ${className}`} aria-label={`${active ? "Remove from" : "Add to"} ${t("nav.favorites").toLowerCase()}`} aria-pressed={active} onClick={() => toggleFavorite(productId)} style={active ? { color: "var(--danger)", background: "#fff2f2" } : undefined}>
      <Heart size={17} fill={active ? "currentColor" : "none"} />
      {label && <span className="sr-only">{t("nav.favorites")}</span>}
    </button>
  );
}
