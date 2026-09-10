import type { Concept, Product } from "@/types/marketplace";

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
}

export function searchMarketplace(query: string, products: Product[], concepts: Concept[]) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return { products, concepts };

  const score = (item: Product) => {
    const haystack = normalize([
      item.name, item.provider, item.type, item.tagline, item.description,
      ...item.tags, ...item.capabilities,
    ].join(" "));
    return terms.reduce((total, term) => {
      if (normalize(item.name).includes(term)) return total + 12;
      if (normalize(item.tags.join(" ")).includes(term)) return total + 7;
      if (normalize(item.capabilities.join(" ")).includes(term)) return total + 5;
      if (haystack.includes(term)) return total + 2;
      return total;
    }, 0);
  };

  return {
    products: products.map((item) => ({ item, score: score(item) }))
      .filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score).map((entry) => entry.item),
    concepts: concepts.map((item) => ({ item, score: score(item) }))
      .filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score).map((entry) => entry.item),
  };
}

export function filterAndSortProducts(
  items: Product[],
  filters: { query?: string; status?: string; type?: string; tag?: string; sort?: string },
) {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const filtered = items.filter((item) => {
    const matchesQuery = !query || [item.name, item.provider, item.description, item.tags.join(" "), item.capabilities.join(" ")]
      .join(" ").toLowerCase().includes(query);
    const matchesStatus = !filters.status || filters.status === "ALL" || item.status === filters.status;
    const matchesType = !filters.type || filters.type === "ALL" || item.type === filters.type;
    const matchesTag = !filters.tag || item.tags.includes(filters.tag);
    return matchesQuery && matchesStatus && matchesType && matchesTag;
  });

  return [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "most-collected": return b.watchers - a.watchers;
      case "most-backed": return b.supporters - a.supporters;
      case "alphabetical": return a.name.localeCompare(b.name);
      default: return b.popularity - a.popularity;
    }
  });
}
