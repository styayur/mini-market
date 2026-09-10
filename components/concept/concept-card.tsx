"use client";

import Link from "next/link";
import { ArrowUpRight, Eye, Sparkles } from "lucide-react";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ProductIcon } from "@/components/product/product-icon";
import { useLanguage } from "@/components/providers/language-provider";
import { formatCompactNumber, formatCredits } from "@/lib/format";
import type { Concept } from "@/types/marketplace";

export function ConceptCard({ concept, compact = false }: { concept: Concept; compact?: boolean }) {
  const { t } = useLanguage();
  return (
    <article className={`card product-card product-card-future ${compact ? "future-compact" : ""}`}>
      <div className="card-topline"><span className="badge badge-future">◇ {t("nav.future").toUpperCase()}</span><FavoriteButton productId={concept.id} /></div>
      <div style={{ marginTop: compact ? 12 : 20 }}><ProductIcon name={concept.icon} future size={compact ? 19 : 23} /></div>
      <h3><Link href={`/concepts/${concept.slug}`}>{concept.name}</Link></h3>
      <div className="product-meta">CONCEPT · {concept.type}</div>
      <p className="product-copy">{concept.tagline}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{concept.tags.slice(0, 3).map((tag) => <span className="chip" key={tag}>{tag}</span>)}</div>
      <div className="card-footer"><span className="product-meta">{formatCompactNumber(concept.watchers)} watching · {formatCredits(concept.supporters)} backers</span><Link className="card-action" href={`/concepts/${concept.slug}`}>{t("common.imagine")} <ArrowUpRight size={13} /></Link></div>
    </article>
  );
}

export function ConceptGrid({ concepts }: { concepts: Concept[] }) {
  return <div className="grid-products">{concepts.map((concept, index) => <ConceptCard key={concept.id} concept={concept} compact={index > 2} />)}</div>;
}

export function ConceptRankItem({ concept, rank }: { concept: Concept; rank: number }) {
  return <Link href={`/concepts/${concept.slug}`} className="rank-item"><span className="rank-number">{String(rank).padStart(2, "0")}</span><div><h3>{concept.name}</h3><p>{concept.tags.slice(0, 3).join(" · ")}</p></div><div style={{ display: "flex", alignItems: "center", gap: 14 }}><span className="muted mono" style={{ fontSize: 10 }}><Eye size={11} /> {formatCompactNumber(concept.watchers)}</span><Sparkles size={14} color="var(--future-accent)" /></div></Link>;
}
