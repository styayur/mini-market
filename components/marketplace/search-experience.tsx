"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { ConceptCard } from "@/components/concept/concept-card";
import { ProductCard } from "@/components/product/product-card";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { searchMarketplace } from "@/lib/search";

export function SearchExperience() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [submitted, setSubmitted] = useState(initial);
  const { products, allConcepts } = useMarketplace();
  const found = useMemo(() => searchMarketplace(submitted, products, allConcepts), [allConcepts, products, submitted]);
  const total = found.products.length + found.concepts.length;

  return <>
    <form className="search-wrap" style={{ maxWidth: 820, marginBottom: 52 }} onSubmit={(event) => { event.preventDefault(); setSubmitted(query.trim()); }} role="search">
      <Search size={20} style={{ position: "absolute", left: 20, top: 18, color: "var(--muted)" }} />
      <input autoFocus className="search-input" style={{ paddingLeft: 52 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search capabilities, providers, and concepts..." aria-label="Search" />
    </form>
    {!submitted ? <div className="empty-state"><div><div className="product-icon" style={{ margin: "0 auto" }}><Search size={21} /></div><h2>Search the boundary between real and imagined.</h2><p>Try “memory”, “agent”, “MCP”, “browser”, or “payments”.</p></div></div> : !total ? <div className="empty-state"><div><div className="product-icon" style={{ margin: "0 auto" }}><Sparkles size={21} /></div><h2>Nothing exactly matches “{submitted}”.</h2><p>Try a related capability, browse FUTURE, or create the missing concept yourself.</p><div style={{ display: "flex", gap: 9, justifyContent: "center", flexWrap: "wrap" }}><Link className="button button-future" href="/concepts/new">Imagine this</Link><Link className="button" href="/future">Browse FUTURE</Link></div></div></div> : <>
      {found.products.length > 0 && <section><div className="section-head"><div><div className="eyebrow" style={{ marginBottom: 12 }}>Available now</div><h2 className="section-title">Real products</h2><p>{found.products.length} results match “{submitted}”.</p></div></div><div className="grid-products">{found.products.map((product, index) => <ProductCard product={product} featured={index === 0 && found.products.length > 3} key={product.id} />)}</div></section>}
      {found.concepts.length > 0 && <section className="section-border page-section" style={{ marginTop: 60 }}><div className="section-head"><div><div className="eyebrow" style={{ marginBottom: 12, color: "var(--future-accent)" }}>Future concepts</div><h2 className="section-title">Things that could exist</h2><p>{found.concepts.length} speculative results match “{submitted}”.</p></div></div><div className="grid-products">{found.concepts.map((concept, index) => <ConceptCard concept={concept} compact={index > 2} key={concept.id} />)}</div></section>}
    </>}
  </>;
}
