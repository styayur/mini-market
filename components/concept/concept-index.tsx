"use client";

import { Lightbulb, Plus } from "lucide-react";
import Link from "next/link";
import { ConceptCard } from "@/components/concept/concept-card";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { SectionHeader } from "@/components/ui/section-header";

export function ConceptIndex() {
  const { createdConcepts, allConcepts, hydrated } = useMarketplace();
  const suggestions = allConcepts.filter((item) => !createdConcepts.some((created) => created.id === item.id)).slice(0, 8);
  return <>
    <section>
      <div className="section-head"><div><div className="eyebrow" style={{ marginBottom: 14 }}>Your concept shelf</div><h2 className="section-title">Ideas you imagined</h2><p>Concepts published in this browser appear here and in FUTURE.</p></div><Link className="button button-future button-sm" href="/concepts/new"><Plus size={14} /> New concept</Link></div>
      {!hydrated ? <div className="grid-products">{[1,2,3].map((item) => <div className="skeleton" style={{ height: 320 }} key={item} />)}</div> : createdConcepts.length ? <div className="grid-products">{createdConcepts.map((concept) => <ConceptCard concept={concept} key={concept.id} />)}</div> : <div className="empty-state"><div><div className="product-icon" style={{ margin: "0 auto" }}><Lightbulb size={21} /></div><h2>Every future product starts as an unreasonable idea.</h2><p>You haven&apos;t imagined anything yet. Describe the capability you wish existed.</p><Link className="button button-future" href="/concepts/new">Imagine something</Link></div></div>}
    </section>
    <section className="section-border page-section"><SectionHeader eyebrow="Curated possibilities" title="Concepts worth exploring" description="Start from an existing idea or branch into your own." href="/future" linkLabel="Open Future Market" /><div className="grid-products">{suggestions.map((concept, index) => <ConceptCard concept={concept} compact={index > 2} key={concept.id} />)}</div></section>
  </>;
}
