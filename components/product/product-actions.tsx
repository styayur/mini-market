"use client";

import Link from "next/link";
import { Check, ExternalLink, Plus, ShoppingBag } from "lucide-react";
import { FavoriteButton } from "@/components/product/favorite-button";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import type { Product } from "@/types/marketplace";

export function ProductActions({ product }: { product: Product }) {
  const { addToCart, cartProductIds, libraryProductIds } = useMarketplace();
  const inCart = cartProductIds.includes(product.id);
  const inLibrary = libraryProductIds.includes(product.id);
  return (
    <div className="detail-actions">
      {inLibrary ? (
        <Link className="button button-primary" href="/library"><Check size={15} /> In your library</Link>
      ) : (
        <button className="button button-primary button-lg" type="button" onClick={() => addToCart(product.id)} disabled={inCart}>
          {inCart ? <><Check size={15} /> Added to cart</> : <><Plus size={15} /> Add to cart</>}
        </button>
      )}
      <FavoriteButton productId={product.id} />
      {product.documentationUrl && <a className="button button-lg" href={product.documentationUrl} target="_blank" rel="noreferrer">Official docs <ExternalLink size={14} /></a>}
      <Link className="button button-lg" href="/cart"><ShoppingBag size={14} /> Cart</Link>
    </div>
  );
}
