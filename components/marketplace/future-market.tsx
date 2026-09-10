"use client";

import { useMemo, useState } from "react";
import { ConceptCard, ConceptRankItem } from "@/components/concept/concept-card";
import { SectionHeader } from "@/components/ui/section-header";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import type { Concept, SortOption } from "@/types/marketplace";

function ConceptGrid({ concepts }: { concepts: Concept[] }) {
  return <div className="grid-products">{concepts.map((concept, index) => <ConceptCard key={concept.id} concept={concept} compact={index > 2} />)}</div>;
}

export function FutureMarket() {
  const { allConcepts } = useMarketplace();
  const [sort, setSort] = useState<SortOption>("trending");
  const sorted = useMemo(() => [...allConcepts].sort((a, b) => {
    if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === "most-collected") return b.watchers - a.watchers;
    if (sort === "most-backed") return b.supporters - a.supporters;
    if (sort === "alphabetical") return a.name.localeCompare(b.name);
    return b.popularity - a.popularity;
  }), [allConcepts, sort]);
  const mostBacked = [...allConcepts].sort((a, b) => b.supporters - a.supporters).slice(0, 5);
  const watched = [...allConcepts].sort((a, b) => b.watchers - a.watchers).slice(0, 4);
  const ambitious = allConcepts.filter((concept) => concept.ambition === "INFRASTRUCTURE" || concept.ambition === "AMBITIOUS").slice(0, 4);
  const different = allConcepts.filter((concept) => concept.tone === "WILD" || concept.tone === "CONSUMER").slice(0, 4);

  return (
    <>
      <div className="market-toolbar" style={{ marginBottom: 24 }}>
        <span className="result-count">{allConcepts.length} speculative concepts</span>
        <select className="select-input" value={sort} onChange={(event) => setSort(event.target.value as SortOption)} aria-label="Sort future concepts">
          <option value="trending">Trending</option><option value="newest">Recently imagined</option><option value="most-collected">Most watched</option><option value="most-backed">Most backed</option><option value="alphabetical">Alphabetical</option>
        </select>
      </div>
      <ConceptGrid concepts={sorted.slice(0, 12)} />
      <section className="section-border page-section"><SectionHeader eyebrow="Recently imagined" title="New signals from the lab" description="Fresh concepts, including ideas published locally in this browser." href="/concepts/new" linkLabel="Imagine something" /><ConceptGrid concepts={[...allConcepts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4)} /></section>
      <section className="page-section"><SectionHeader eyebrow="Collective support" title="Most backed" description="The ideas with the strongest simulated credit support." /><div className="rank-list">{mostBacked.map((concept, index) => <ConceptRankItem concept={concept} rank={index + 1} key={concept.id} />)}</div></section>
      <section className="section-border page-section"><SectionHeader eyebrow="Most watched" title="Signals from the edge" description="Concepts builders are keeping an eye on." /><ConceptGrid concepts={watched} /></section>
      <section className="page-section"><SectionHeader eyebrow="Infrastructure" title="Most technically ambitious" description="Protocols and systems designed to become invisible foundations." /><ConceptGrid concepts={ambitious} /></section>
      <section className="section-border page-section"><SectionHeader eyebrow="Different tones" title="Weird, small, and consumer ideas" description="Not every useful capability has to be enterprise infrastructure." /><ConceptGrid concepts={different} /></section>
    </>
  );
}

