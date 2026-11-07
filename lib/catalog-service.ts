import type { FeedContentType, FeedItem, FeedSubscription } from "@/types/feed";
import type { Product, ProductType } from "@/types/marketplace";
import { stableHash } from "./feed/url.ts";

const TYPE_BY_CATEGORY: Record<FeedContentType, ProductType> = {
  ARTICLE: "ARTICLE",
  IDEA: "IDEA",
  PRODUCT: "VIRTUAL_GOOD",
  RESEARCH: "RESEARCH",
  PROJECT: "PROJECT",
  OTHER: "PUBLICATION",
};

export class CatalogService {
  /** Curated products stay separate from imported and user-created records while sharing one typed storefront view. */
  list(curated: Product[], subscriptions: FeedSubscription[], items: FeedItem[], libraryProductIds: string[] = []): Product[] {
    const subscriptionMap = new Map(subscriptions.map((subscription) => [subscription.id, subscription]));
    const imported = items.flatMap((item) => {
      const subscription = subscriptionMap.get(item.subscriptionId);
      if (!subscription) {
        return libraryProductIds.includes(item.productId) ? [this.importedProduct(item, item.productId, "Archived feed item", "", item.sourceLanguage)] : [];
      }
      if (!subscription.enabled && !libraryProductIds.includes(item.productId)) return [];
      return [this.importedProduct(item, subscription.priceAtomic, subscription.title, subscription.feedUrl, item.sourceLanguage)];
    });
    const seen = new Set<string>();
    return [...curated, ...imported].filter((product) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
  }

  importedProduct(item: FeedItem, priceAtomic: string, feedTitle: string, feedUrl: string, sourceLanguage?: string): Product {
    const fallbackIdentifier = `${item.sourceId}:${item.itemIdentifier}`;
    const id = item.productId || `rss-${stableHash(fallbackIdentifier)}`;
    const published = item.publishedAt ?? item.fetchedAt;
    const description = item.description || "No description was supplied by the publisher.";
    return {
      id,
      slug: `feed-${stableHash(item.stableKey)}`,
      name: item.title,
      type: TYPE_BY_CATEGORY[item.contentType] ?? "ARTICLE",
      status: "NOW",
      provider: feedTitle,
      tagline: description.length > 170 ? `${description.slice(0, 167)}...` : description,
      description,
      icon: item.contentType === "RESEARCH" ? "database" : item.contentType === "PRODUCT" ? "blocks" : item.contentType === "PROJECT" ? "code" : "pen",
      tags: ["rss", item.contentType.toLowerCase(), ...(sourceLanguage ? [sourceLanguage.toLowerCase()] : [])],
      capabilities: ["external subscription", item.contentType.toLowerCase(), "source attribution"],
      version: "Imported feed item",
      documentationUrl: item.originalUrl,
      pricing: { model: "ONE_TIME", unit: "simulated content pass" },
      priceAtomic,
      availability: "EXTERNAL",
      verified: false,
      popularity: 0,
      watchers: 0,
      supporters: 0,
      relatedProductIds: [],
      relatedConceptIds: [],
      createdAt: published,
      authModel: "No external account or service access is granted by this simulation.",
      origin: {
        kind: "RSS",
        feedUrl,
        feedTitle,
        itemId: item.itemIdentifier,
        originalUrl: item.originalUrl,
        publishedAt: item.publishedAt,
        fetchedAt: item.fetchedAt,
        author: item.author,
        sourceLanguage,
        contentType: item.contentType,
      },
    };
  }
}

export const catalogService = new CatalogService();
