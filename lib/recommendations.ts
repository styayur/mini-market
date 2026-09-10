import type { Concept, Product } from "@/types/marketplace";

export function recommendProducts(source: Product, all: Product[], limit = 3) {
  return [...all]
    .filter((item) => item.id !== source.id)
    .map((item) => ({
      item,
      score:
        (source.relatedProductIds.includes(item.id) ? 30 : 0) +
        item.tags.filter((tag) => source.tags.includes(tag)).length * 5 +
        item.capabilities.filter((capability) => source.capabilities.includes(capability)).length * 8 +
        item.popularity * 0.1,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function recommendConcepts(source: Product, all: Concept[], limit = 3) {
  return [...all]
    .filter((item) => item.id !== source.id)
    .map((item) => ({
      item,
      score:
        (source.relatedConceptIds.includes(item.id) ? 30 : 0) +
        item.tags.filter((tag) => source.tags.includes(tag)).length * 5 +
        item.capabilities.filter((capability) => source.capabilities.includes(capability)).length * 8 +
        item.popularity * 0.1,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}
