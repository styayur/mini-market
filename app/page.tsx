"use client";

import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { ConceptCard, ConceptRankItem } from "@/components/concept/concept-card";
import { ProductCard, CompactProductCard } from "@/components/product/product-card";
import { SectionHeader } from "@/components/ui/section-header";
import { useLanguage } from "@/components/providers/language-provider";
import { categories } from "@/data/categories";
import { concepts } from "@/data/concepts";
import { products } from "@/data/products";

function CapabilityMap() {
  const nodes = [
    { x: 200, y: 42, label: "MEMORY" }, { x: 72, y: 142, label: "VISION" },
    { x: 328, y: 142, label: "TOOLS" }, { x: 200, y: 230, label: "AGENT" },
    { x: 72, y: 326, label: "IDENTITY" }, { x: 328, y: 326, label: "PAYMENTS" },
  ];
  return (
    <div className="capability-map" aria-label="Abstract map of AI capability relationships">
      <svg viewBox="0 0 400 390" role="img">
        <circle className="map-orbit" cx="200" cy="210" r="142" />
        <circle className="map-orbit" cx="200" cy="210" r="104" />
        {nodes.map((node) => <line className="map-line" key={node.label} x1="200" y1="210" x2={node.x} y2={node.y} />)}
        <circle className="map-node-core" cx="200" cy="210" r="42" />
        <text className="map-label map-label-core" x="200" y="214" textAnchor="middle">AGENT</text>
        {nodes.filter((node) => node.label !== "AGENT").map((node) => (
          <g key={node.label}><circle className="map-node" cx={node.x} cy={node.y} r="25" /><text className="map-label" x={node.x} y={node.y + 3} textAnchor="middle">{node.label}</text></g>
        ))}
      </svg>
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const trending = [...products].sort((a, b) => b.popularity - a.popularity).slice(0, 4);
  const future = [...concepts].sort((a, b) => b.popularity - a.popularity).slice(0, 4);
  const mostBacked = [...concepts].sort((a, b) => b.supporters - a.supporters).slice(0, 5);
  const newest = [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(2, 5);
  return (
    <>
      <section className="hero">
        <div className="container-wide hero-inner">
          <div className="hero-copy">
            <div className="eyebrow hero-kicker"><Sparkles size={13} /> {t("home.eyebrow")}</div>
            <h1 className="display text-balance">{t("home.title1")}<br />{t("home.title2")}</h1>
            <p className="lead hero-sub">{t("home.description")}</p>
            <form className="search-wrap hero-search" action={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/search/`} role="search">
              <Search size={19} style={{ position: "absolute", left: 20, top: 18, color: "var(--muted)" }} />
              <input className="search-input" style={{ paddingLeft: 50 }} name="q" placeholder={t("home.search")} aria-label="Search the marketplace" />
              <button className="search-submit" type="submit" aria-label="Search"><ArrowRight size={18} /></button>
            </form>
            <div className="hero-actions">
              <Link href="/marketplace" className="button button-primary button-lg">{t("home.explore")} <ArrowRight size={15} /></Link>
              <Link href="/concepts/new" className="button button-lg">{t("home.imagine")} <Sparkles size={15} /></Link>
            </div>
            <div className="hero-stats"><span>{t("home.capabilities", { count: products.length })}</span><span>{t("home.concepts", { count: concepts.length })}</span><span>{t("home.demo")}</span></div>
          </div>
          <CapabilityMap />
        </div>
      </section>

      <section className="container page-section">
        <SectionHeader eyebrow="Production software" title="Trending NOW" description="Real products and developer capabilities, linked to official documentation rather than invented claims." href="/marketplace?status=NOW" linkLabel="Explore NOW" />
        <div className="grid-products">{trending.map((product, index) => <ProductCard key={product.id} product={product} featured={index === 0} />)}</div>
      </section>

      <section className="container section-tight">
        <SectionHeader eyebrow="New arrivals" title="Fresh in the catalog" description="Recently indexed developer capabilities and tools." href="/marketplace?sort=newest" />
        <div className="grid-three">{newest.map((product) => <CompactProductCard key={product.id} product={product} />)}</div>
      </section>

      <section className="container section-tight">
        <SectionHeader eyebrow="Editor choices" title="A curated mix of real and imagined" description="One collection crossing the boundary between current infrastructure and future proposals." />
        <div className="grid-three"><ProductCard product={products.find((item) => item.id === "mcp-sdk")!} />{concepts.slice(0, 2).map((concept) => <ConceptCard key={concept.id} concept={concept} compact />)}</div>
      </section>

      <section className="section-border page-section">
        <div className="container">
          <SectionHeader eyebrow="Speculative software" title="What could exist next?" description="Every FUTURE card is explicitly speculative: understandable as a product, but not represented as an existing service." href="/future" linkLabel="Enter Future Market" />
          <div className="grid-products">{future.map((concept, index) => <ConceptCard key={concept.id} concept={concept} compact={index > 2} />)}</div>
        </div>
      </section>

      <section className="container page-section">
        <div className="editorial-block">
          <h2>What does an API become when agents are the customer?</h2>
          <p>Maybe identity becomes portable. Permissions become purpose-bound. Context becomes a product. The Future Market turns those questions into inspectable technical concepts.</p>
          <Link className="editorial-link" href="/future">Explore {concepts.length} concepts <ArrowRight size={15} /></Link>
        </div>
      </section>

      <section className="container section-tight" id="categories">
        <SectionHeader eyebrow="Capability graph" title="Browse by capability" description="Follow an underlying capability across real implementations and speculative possibilities." />
        <div className="category-strip">
          {categories.slice(0, 12).map((category) => (
            <Link className="category-tile" href={`/categories/${category.slug}`} key={category.slug}>
              <span className="symbol">{category.icon}</span><strong>{category.name}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="container page-section">
        <SectionHeader eyebrow="Collective imagination" title="Rising concepts" description="The ideas gaining attention from builders and early supporters." href="/future?sort=most-backed" linkLabel="See rankings" />
        <div className="rank-list">{mostBacked.map((concept, index) => <ConceptRankItem concept={concept} rank={index + 1} key={concept.id} />)}</div>
      </section>
    </>
  );
}




