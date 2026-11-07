import type { Concept, Product } from "@/types/marketplace";

/** User concepts are local data, so use a pre-exported query route on Pages. */
export function conceptHref(concept: Pick<Concept, "slug" | "isUserCreated">) {
  return concept.isUserCreated
    ? `/concepts/view/?slug=${encodeURIComponent(concept.slug)}`
    : `/concepts/${concept.slug}`;
}

export function productHref(product: Pick<Product, "slug" | "status" | "origin">) {
  if (product.status === "FUTURE") return conceptHref(product as Pick<Concept, "slug" | "isUserCreated">);
  if (product.origin.kind === "RSS") return `/marketplace/view/?slug=${encodeURIComponent(product.slug)}`;
  return `/marketplace/${product.slug}`;
}
