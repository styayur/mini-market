"use client";

import { Database, RotateCcw, ShieldCheck } from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { formatCredits } from "@/lib/format";

export function SettingsPanel() {
  const { credits, cartProductIds, favoriteProductIds, libraryProductIds, createdConcepts, watchedConceptIds, resetDemo, hydrated } = useMarketplace();
  return <div className="grid-two">
    <section className="card" style={{ padding: 26 }}><div className="eyebrow">Demo profile</div><h2 className="section-title" style={{ marginTop: 14, fontSize: 38 }}>You</h2><p className="lead" style={{ marginTop: 12, fontSize: 14 }}>{hydrated ? formatCredits(credits) : "—"} demo credits</p><dl style={{ marginTop: 26 }}><div className="meta-row"><dt>Library</dt><dd>{libraryProductIds.length}</dd></div><div className="meta-row"><dt>Cart</dt><dd>{cartProductIds.length}</dd></div><div className="meta-row"><dt>Favorites</dt><dd>{favoriteProductIds.length}</dd></div><div className="meta-row"><dt>Concepts</dt><dd>{createdConcepts.length}</dd></div><div className="meta-row"><dt>Watched</dt><dd>{watchedConceptIds.length}</dd></div></dl></section>
    <section className="card" style={{ padding: 26 }}><div className="eyebrow">Data and safety</div><h2 style={{ marginTop: 16, fontSize: 24 }}>Local-only demo state</h2><div style={{ display: "grid", gap: 18, marginTop: 24 }}><div style={{ display: "flex", gap: 12 }}><Database size={18} /><p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>Cart, favorites, watchlist, library, concepts, backings, and purchases are stored in your browser&apos;s localStorage.</p></div><div style={{ display: "flex", gap: 12 }}><ShieldCheck size={18} /><p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>Mini Market never asks for API keys, stores financial credentials, or processes real payments.</p></div></div><button className="button" type="button" onClick={resetDemo} style={{ marginTop: 28 }}><RotateCcw size={14} /> Reset demo data</button></section>
  </div>;
}
