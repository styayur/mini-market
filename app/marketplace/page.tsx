import { MarketHeading } from "@/components/marketplace/market-heading";
import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { ProductCardSkeleton } from "@/components/ui/loading-state";
import { categories } from "@/data/categories";
import { concepts } from "@/data/concepts";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Explore real capabilities and speculative concepts.",
};

export default function MarketplacePage() {
  return (
    <div className="container commerce-page">
      <MarketHeading />
      <Suspense
        fallback={
          <div className="grid-products">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <ProductCardSkeleton key={item} />
            ))}
          </div>
        }
      >
        <MarketplaceBrowser products={products} concepts={concepts} />
      </Suspense>
      <section
        id="categories"
        className="section-border page-section"
        style={{ marginTop: 60 }}
      >
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          Browse by capability
        </div>
        <h2 className="section-title" style={{ marginBottom: 28 }}>
          Start from an underlying need.
        </h2>
        <div className="category-strip">
          {categories.slice(0, 12).map((category) => (
            <Link
              className="category-tile"
              href={`/categories/${category.slug}`}
              key={category.slug}
            >
              <span className="symbol">{category.icon}</span>
              <strong>{category.name}</strong>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
