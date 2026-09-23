"use client";

import Link from "next/link";
import { conceptHref } from "@/lib/links";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ProductIcon } from "@/components/product/product-icon";
import { useLanguage } from "@/components/providers/language-provider";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { formatCredits } from "@/lib/format";
import type { Product } from "@/types/marketplace";

export function ProductCard({
  product,
}: {
  product: Product;
  featured?: boolean;
}) {
  const future = product.status === "FUTURE";
  const href = future ? conceptHref(product) : `/marketplace/${product.slug}`;
  const { language } = useLanguage();
  const { addToCart, cartProductIds, hydrated } = useMarketplace();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const inCart = cartProductIds.includes(product.id);
  const tone = product.tags.includes("models")
    ? "mint"
    : product.tags.includes("code")
      ? "blue"
      : product.tags.includes("data")
        ? "peach"
        : "lavender";
  return (
    <article className={`shop-product ${future ? "shop-product-future" : ""}`}>
      <div className={`product-stage stage-${tone}`}>
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="product-stage-link"
        >
          <span className="stage-ring" />
          <ProductIcon name={product.icon} size={36} large future={future} />
          <span className="stage-word">
            {product.type === "API"
              ? "Capability pass"
              : `${product.type.toLowerCase()} collection`}
          </span>
        </Link>
        <span className={`badge ${future ? "badge-future" : "badge-live"}`}>
          {future
            ? c("Future concept", "未来概念")
            : c("Available to collect", "可收藏")}
        </span>
        <FavoriteButton productId={product.id} />
      </div>
      <div className="shop-product-body">
        <div className="product-maker">
          {product.provider}
          <span>{product.type}</span>
        </div>
        <h3>
          <Link href={href}>
            {product.name} <ArrowUpRight size={15} />
          </Link>
        </h3>
        <p>{product.tagline}</p>
        <div className="product-tagline">
          {product.tags.slice(0, 2).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="shop-product-bottom">
          <div className="token-price">
            <strong>
              {future
                ? c("Imagine", "想象中")
                : `◈ ${formatCredits(product.demoPrice)}`}
            </strong>
            <small>
              {future
                ? c("Not implemented", "尚未实现")
                : c("Token / demo pass", "Token / 体验通行证")}
            </small>
          </div>
          {future ? (
            <Link
              className="quick-add"
              href={href}
              aria-label={c(`Explore ${product.name}`, `了解 ${product.name}`)}
            >
              <ArrowUpRight size={18} />
            </Link>
          ) : (
            <button
              className="quick-add"
              data-added={inCart}
              type="button"
              disabled={!hydrated || inCart}
              onClick={() => addToCart(product.id)}
              aria-label={
                inCart
                  ? c(`${product.name} in bag`, `${product.name} 已在购物袋`)
                  : c(
                      `Add ${product.name} to bag`,
                      `将 ${product.name} 加入购物袋`,
                    )
              }
            >
              {inCart ? <Check size={18} /> : <Plus size={19} />}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid-products">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
export function CompactProductCard({ product }: { product: Product }) {
  return (
    <Link className="compact-shop-card" href={`/marketplace/${product.slug}`}>
      <ProductIcon name={product.icon} />
      <div>
        <strong>{product.name}</strong>
        <small>{product.provider}</small>
      </div>
      <span>◈ {formatCredits(product.demoPrice)}</span>
    </Link>
  );
}
