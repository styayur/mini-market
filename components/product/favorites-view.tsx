"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { ConceptCard } from "@/components/concept/concept-card";
import { ProductCard } from "@/components/product/product-card";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import type { Concept, Product } from "@/types/marketplace";

export function FavoritesView() {
  const { favoriteProductIds, products, allConcepts, hydrated } = useMarketplace();
  const items: Array<Product | Concept> = favoriteProductIds.map((id) => products.find((item) => item.id === id) ?? allConcepts.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => item !== undefined);
  if (!hydrated) return <div className="skeleton" style={{ height: 420 }} />;
  if (!items.length) return <div className="empty-state"><div><Heart size={26} /><h2>No favorites yet.</h2><p>Save capabilities and concepts worth returning to.</p><Link className="button button-primary" href="/marketplace">Explore marketplace</Link></div></div>;
  return <div className="grid-products">{items.map((item) => item.status === "NOW" ? <ProductCard key={item.id} product={item as Product} /> : <ConceptCard key={item.id} concept={item as Concept} compact />)}</div>;
}



