import type { AtomicAmount } from "@/types/economy";

export type FeedFormat = "RSS" | "ATOM" | "JSON_FEED" | "UNKNOWN";
export type FeedContentType = "ARTICLE" | "IDEA" | "PRODUCT" | "RESEARCH" | "PROJECT" | "OTHER";
export type FeedImportStatus = "IMPORTED" | "UPDATED" | "UNCHANGED" | "FAILED";
export type FeedStatus = "IDLE" | "REFRESHING" | "READY" | "STALE" | "ERROR" | "BACKOFF";
export type ProxyAdapterId = "direct" | "cors-dev" | "cors-tools" | "custom";

export type FeedErrorCode =
  | "INVALID_URL"
  | "BLOCKED_URL"
  | "NETWORK"
  | "CORS"
  | "HTTP_404"
  | "HTTP_429"
  | "HTTP_5XX"
  | "HTTP_ERROR"
  | "TIMEOUT"
  | "OVERSIZED"
  | "INVALID_XML"
  | "INVALID_FEED"
  | "MALFORMED_CONTENT"
  | "PROXY_FAILURE"
  | "CACHE_MISS"
  | "UNKNOWN";

export interface FeedFailure {
  code: FeedErrorCode;
  message: string;
  status?: number;
  at: string;
  proxyId?: ProxyAdapterId;
  retryAfterMs?: number;
}

export interface FeedSource {
  id: string;
  feedUrl: string;
  title: string;
  homePageUrl?: string;
  format: FeedFormat;
  language?: string;
  lastFetchedAt?: string;
  etag?: string;
  lastModified?: string;
}

export interface FeedSubscription {
  id: string;
  sourceId: string;
  feedUrl: string;
  title: string;
  enabled: boolean;
  category: FeedContentType;
  priceAtomic: AtomicAmount;
  refreshIntervalMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeedItem {
  id: string;
  stableKey: string;
  sourceId: string;
  subscriptionId: string;
  itemIdentifier: string;
  originalUrl?: string;
  publishedAt?: string;
  title: string;
  description: string;
  contentHtml?: string;
  contentType: FeedContentType;
  author?: string;
  fetchedAt: string;
  sourceLanguage?: string;
  importStatus: FeedImportStatus;
  productId: string;
}

export interface FeedRefreshState {
  subscriptionId: string;
  status: FeedStatus;
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  failureCount: number;
  nextAttemptAt?: string;
  lastFailure?: FeedFailure;
  importedCount: number;
  updatedCount: number;
  unchangedCount: number;
  usedCache: boolean;
}

export interface ProxySettings {
  enabledAdapterIds: ProxyAdapterId[];
  customAdapter?: {
    label: string;
    /** Must include the {url} placeholder. */
    template: string;
    enabled: boolean;
  };
}

export interface FeedCacheEntry {
  feedUrl: string;
  body: string;
  contentType?: string;
  fetchedAt: string;
  etag?: string;
  lastModified?: string;
  source: "DIRECT" | "PROXY" | "UNKNOWN";
  proxyId?: ProxyAdapterId;
}
