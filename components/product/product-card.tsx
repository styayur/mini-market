"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FavoriteButton } from "@/components/product/favorite-button";
import { StatusBadge, TypeBadge } from "@/components/product/product-badges";
import { ProductIcon } from "@/components/product/product-icon";
import { useLanguage } from "@/components/providers/language-provider";
import { formatCredits } from "@/lib/format";
import type { Product } from "@/types/marketplace";

export function ProductCard({ product, featured = false }: { product: Product; featured?: boolean }) {
  const future = product.status === "FUTURE";
  const href = future ? `/concepts/${product.slug}` : `/marketplace/${product.slug}`;
  const { t } = useLanguage();
  return (
    <article className={`card product-card ${future ? "product-card-future" : ""} ${featured ? "featured-card" : ""}`}>
      <div className="card-topline"><StatusBadge product={product} /><FavoriteButton productId={product.id} /></div>
      <div style={{ marginTop: featured ? 26 : 20 }}><ProductIcon name={product.icon} large={featured} future={future} size={featured ? 30 : 23} /></div>
      <h3><Link href={href}>{product.name}</Link></h3>
      <div className="product-meta">{product.type} · {product.provider}</div>
      <p className="product-copy">{featured ? product.description : product.tagline}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{product.tags.slice(0, featured ? 5 : 3).map((tag) => <span className="chip" key={tag}>{tag}</span>)}</div>
      <div className="card-footer"><span className="product-meta">{future ? t("common.notImplemented") : product.demoPrice > 0 ? t("common.demoCredits", { count: formatCredits(product.demoPrice) }) : t("common.included")}</span><Link className="card-action" href={href}>{future ? t("common.imagine") : t("common.view")} <ArrowUpRight size={13} /></Link></div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return <div className="grid-products">{products.map((product, index) => <ProductCard key={product.id} product={product} featured={index === 0 && products.length > 3} />)}</div>;
}

export function CompactProductCard({ product }: { product: Product }) {
  const href = `/marketplace/${product.slug}`;
  return <article className="card" style={{ padding: 18, display: "grid", gridTemplateColumns: "50px 1fr auto", gap: 14, alignItems: "center" }}><ProductIcon name={product.icon} /><div><h3 style={{ fontSize: 15, fontWeight: 650 }}><Link href={href}>{product.name}</Link></h3><p className="muted" style={{ fontSize: 11, marginTop: 4 }}>{product.type} · {product.provider}</p></div><TypeBadge type={product.availability} /></article>;
}
