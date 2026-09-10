"use client";

import Link from "next/link";
import { BookOpen, Heart, Lightbulb, Library, Sparkles } from "lucide-react";
import { ConceptCard, ConceptGrid } from "@/components/concept/concept-card";
import { ProductCard } from "@/components/product/product-card";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { formatCredits } from "@/lib/format";

export function DashboardStats() {
  const { credits, libraryProductIds, createdConcepts, watchedConceptIds, products, allConcepts, hydrated } = useMarketplace();
  const library = libraryProductIds.map((id) => products.find((product) => product.id === id)).filter((product) => product !== undefined);
  const watched = watchedConceptIds.map((id) => allConcepts.find((concept) => concept.id === id)).filter((concept) => concept !== undefined);
  return <>
    <div className="dashboard-hero"><div className="eyebrow" style={{ marginBottom: 18 }}>Your market</div><h1 className="page-title">Dashboard</h1><div className="stats-grid" style={{ marginTop: 42 }}>
      <div className="credit-card"><div className="eyebrow" style={{ color: "#afb1ad" }}>Demo credits</div><div className="credit-value">{hydrated ? formatCredits(credits) : "—"}</div><p className="muted" style={{ marginTop: 12, fontSize: 10 }}>Fictional · no real-world value</p></div>
      <div className="stats-grid" style={{ gridColumn: "span 2" }}><div className="card stat-card"><Library size={19} /><div className="stat-value">{library.length}</div><div className="eyebrow">In library</div></div><div className="card stat-card"><Lightbulb size={19} /><div className="stat-value">{createdConcepts.length}</div><div className="eyebrow">Concepts</div></div><div className="card stat-card"><Heart size={19} /><div className="stat-value">{watched.length}</div><div className="eyebrow">Watched</div></div></div>
    </div></div>
    <section className="dashboard-section"><div className="section-head"><div><div className="eyebrow" style={{ marginBottom: 12 }}>Your collection</div><h2 className="section-title">Recently acquired</h2></div><Link className="button button-sm" href="/library">Open library</Link></div>{library.length ? <div className="grid-three">{library.slice(0, 3).map((product) => <ProductCard product={product} key={product.id} />)}</div> : <div className="empty-state"><div><Library size={26} /><h2>No acquired capabilities yet.</h2><p>Browse the marketplace and simulate a purchase to build your library.</p><Link className="button button-primary" href="/marketplace">Explore NOW</Link></div></div>}</section>
    <section className="dashboard-section"><div className="section-head"><div><div className="eyebrow" style={{ marginBottom: 12 }}>Your ideas</div><h2 className="section-title">Your concepts</h2></div><Link className="button button-future button-sm" href="/concepts/new"><Sparkles size={13} /> Imagine something</Link></div>{createdConcepts.length ? <ConceptGrid concepts={createdConcepts} /> : <div className="empty-state"><div><Lightbulb size={26} /><h2>You haven&apos;t imagined anything yet.</h2><p>Describe the capability you wish existed and publish it to your local FUTURE market.</p><Link className="button button-future" href="/concepts/new">Open Concept Lab</Link></div></div>}</section>
    <section className="dashboard-section"><div className="section-head"><div><div className="eyebrow" style={{ marginBottom: 12 }}>Signals</div><h2 className="section-title">Watchlist</h2></div><Link className="button button-sm" href="/future">Explore FUTURE</Link></div>{watched.length ? <div className="grid-products">{watched.map((concept, index) => <ConceptCard concept={concept} compact={index > 2} key={concept.id} />)}</div> : <div className="empty-state"><div><BookOpen size={26} /><h2>Nothing watched yet.</h2><p>Start collecting ideas from tomorrow.</p><Link className="button button-future" href="/future">Browse concepts</Link></div></div>}</section>
  </>;
}
