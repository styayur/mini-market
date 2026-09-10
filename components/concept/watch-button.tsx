"use client";

import { Eye } from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";

export function WatchButton({ conceptId, compact = false }: { conceptId: string; compact?: boolean }) {
  const { watchedConceptIds, toggleWatch } = useMarketplace();
  const active = watchedConceptIds.includes(conceptId);
  return (
    <button
      type="button"
      className={`button ${compact ? "button-sm" : ""} ${active ? "button-future" : ""}`}
      aria-pressed={active}
      onClick={() => toggleWatch(conceptId)}
    >
      <Eye size={15} />
      {active ? "Watching" : "Watch"}
    </button>
  );
}
