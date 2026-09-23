import type { Concept } from "@/types/marketplace";

/** User concepts are local data, so use a pre-exported query route on Pages. */
export function conceptHref(concept: Pick<Concept, "slug" | "isUserCreated">) {
  return concept.isUserCreated
    ? `/concepts/view/?slug=${encodeURIComponent(concept.slug)}`
    : `/concepts/${concept.slug}`;
}
