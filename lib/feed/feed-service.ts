import type {
  FeedContentType,
  FeedFailure,
  FeedItem,
  FeedRefreshState,
  FeedSource,
  FeedSubscription,
  ProxySettings,
} from "@/types/feed";
import type { PersistedMarketplaceState } from "@/types/marketplace";
import type { AtomicAmount } from "@/types/economy";
import { IndexedDbFeedCache } from "./feed-cache.ts";
import { parseFeed } from "./parser.ts";
import { ProxyService, type FeedCache } from "./proxy-service.ts";
import { sanitizeFeedTitle } from "./sanitize.ts";
import {
  FeedServiceError,
  assertSafeFeedUrl,
  canonicalizeUrl,
  stableFeedItemKey,
  stableHash,
} from "./url.ts";

const MIN_REFRESH_MINUTES = 15;
const MAX_REFRESH_MINUTES = 10_080;
const BACKOFF_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000];
const VALID_CATEGORIES: FeedContentType[] = ["ARTICLE", "IDEA", "PRODUCT", "RESEARCH", "PROJECT", "OTHER"];

export interface AddFeedInput {
  feedUrl: string;
  title?: string;
  category?: FeedContentType;
  priceAtomic?: AtomicAmount;
  refreshIntervalMinutes?: number;
}

export interface FeedRefreshResult {
  state: PersistedMarketplaceState;
  subscriptionId: string;
  status: FeedRefreshState;
  error?: FeedFailure;
}

function failureFrom(error: unknown): FeedFailure {
  const at = new Date().toISOString();
  if (error instanceof FeedServiceError) {
    return { code: error.code, message: error.message, status: error.status, retryAfterMs: error.retryAfterMs, at };
  }
  return { code: "UNKNOWN", message: "The feed could not be refreshed.", at };
}

function nextBackoff(failure: FeedFailure, failureCount: number): string {
  const requested = failure.retryAfterMs;
  const base = BACKOFF_MS[Math.min(Math.max(0, failureCount - 1), BACKOFF_MS.length - 1)];
  return new Date(Date.now() + Math.max(requested ?? 0, base)).toISOString();
}

function itemsChanged(existing: FeedItem, next: Omit<FeedItem, "importStatus">): boolean {
  return existing.title !== next.title || existing.description !== next.description || existing.originalUrl !== next.originalUrl || existing.publishedAt !== next.publishedAt;
}

export interface FeedServiceOptions {
  cache?: FeedCache;
  proxyFactory?: (settings: ProxySettings) => ProxyService;
  now?: () => Date;
}

export class FeedService {
  private readonly cache: FeedCache;
  private readonly proxyFactory: (settings: ProxySettings) => ProxyService;
  private readonly now: () => Date;

  constructor(options: FeedServiceOptions = {}) {
    this.cache = options.cache ?? new IndexedDbFeedCache();
    this.now = options.now ?? (() => new Date());
    this.proxyFactory = options.proxyFactory ?? ((settings) => new ProxyService({
      proxySettings: settings,
      cache: this.cache,
      validate: (body, contentType) => { parseFeed(body, { contentType }); },
      now: this.now,
    }));
  }

  createDraft(input: AddFeedInput, existing?: FeedSubscription): { source: FeedSource; subscription: FeedSubscription } {
    const url = assertSafeFeedUrl(input.feedUrl);
    const canonicalUrl = canonicalizeUrl(url.toString());
    const sourceId = existing?.sourceId ?? `feed-source-${stableHash(canonicalUrl)}`;
    const subscriptionId = existing?.id ?? `feed-sub-${stableHash(canonicalUrl)}`;
    const current = this.now().toISOString();
    const interval = Math.max(MIN_REFRESH_MINUTES, Math.min(MAX_REFRESH_MINUTES, Math.trunc(input.refreshIntervalMinutes ?? 60)));
    const title = sanitizeFeedTitle(input.title || url.hostname) || url.hostname;
    const category = input.category && VALID_CATEGORIES.includes(input.category) ? input.category : "ARTICLE";
    const subscription: FeedSubscription = {
      id: subscriptionId,
      sourceId,
      feedUrl: canonicalUrl,
      title: existing?.title ?? title,
      enabled: true,
      category,
      priceAtomic: input.priceAtomic ?? existing?.priceAtomic ?? "0",
      refreshIntervalMinutes: interval,
      createdAt: existing?.createdAt ?? current,
      updatedAt: current,
    };
    return {
      source: {
        id: sourceId,
        feedUrl: canonicalUrl,
        title: existing?.title ?? title,
        format: "UNKNOWN",
      },
      subscription,
    };
  }

  async addSubscription(state: PersistedMarketplaceState, input: AddFeedInput): Promise<FeedRefreshResult> {
    const url = assertSafeFeedUrl(input.feedUrl);
    const canonicalUrl = canonicalizeUrl(url.toString());
    const existing = state.feedSubscriptions.find((subscription) => canonicalizeUrl(subscription.feedUrl) === canonicalUrl);
    const draft = this.createDraft({ ...input, feedUrl: canonicalUrl }, existing);
    const nextState: PersistedMarketplaceState = {
      ...state,
      feedSubscriptions: existing
        ? state.feedSubscriptions.map((subscription) => subscription.id === existing.id ? draft.subscription : subscription)
        : [...state.feedSubscriptions, draft.subscription],
      feedSources: state.feedSources.some((source) => source.id === draft.source.id)
        ? state.feedSources
        : [...state.feedSources, draft.source],
      feedRefreshStates: {
        ...state.feedRefreshStates,
        [draft.subscription.id]: state.feedRefreshStates[draft.subscription.id] ?? {
          subscriptionId: draft.subscription.id,
          status: "IDLE",
          failureCount: 0,
          importedCount: 0,
          updatedCount: 0,
          unchangedCount: 0,
          usedCache: false,
        },
      },
    };
    return this.refresh(nextState, draft.subscription.id, { force: true });
  }

  isDue(subscription: FeedSubscription, refreshState: FeedRefreshState | undefined, now = this.now()): boolean {
    if (!subscription.enabled) return false;
    if (!refreshState?.lastSuccessAt) return true;
    if (refreshState.nextAttemptAt && new Date(refreshState.nextAttemptAt).getTime() > now.getTime()) return false;
    const dueAt = new Date(refreshState.lastSuccessAt).getTime() + subscription.refreshIntervalMinutes * 60_000;
    return dueAt <= now.getTime();
  }

  async refresh(
    state: PersistedMarketplaceState,
    subscriptionId: string,
    options: { force?: boolean } = {},
  ): Promise<FeedRefreshResult> {
    const subscription = state.feedSubscriptions.find((entry) => entry.id === subscriptionId);
    if (!subscription) throw new Error("Feed subscription not found.");
    const previous = state.feedRefreshStates[subscriptionId];
    if (!options.force && previous?.nextAttemptAt && new Date(previous.nextAttemptAt).getTime() > this.now().getTime()) {
      return { state, subscriptionId, status: previous };
    }
    const now = this.now().toISOString();
    const refreshingState: PersistedMarketplaceState = {
      ...state,
      feedRefreshStates: {
        ...state.feedRefreshStates,
        [subscriptionId]: {
          ...(previous ?? { subscriptionId, failureCount: 0, importedCount: 0, updatedCount: 0, unchangedCount: 0, usedCache: false }),
          subscriptionId,
          status: "REFRESHING",
          lastAttemptAt: now,
        } as FeedRefreshState,
      },
    };
    try {
      const proxy = this.proxyFactory(state.proxySettings);
      const result = await proxy.fetchFeed(subscription.feedUrl);
      const parsed = parseFeed(result.body, { contentType: result.contentType, maxItems: 40 });
      const fetchedAt = result.fetchedAt;
      const feedSource: FeedSource = {
        id: subscription.sourceId,
        feedUrl: subscription.feedUrl,
        title: parsed.title,
        homePageUrl: parsed.homePageUrl,
        format: parsed.format,
        language: parsed.language,
        lastFetchedAt: fetchedAt,
      };
      const existingItems = new Map(state.feedItems.map((item) => [item.stableKey, item]));
      const nextItems: FeedItem[] = [];
      let importedCount = 0;
      let updatedCount = 0;
      let unchangedCount = 0;
      for (const item of parsed.items) {
        const stableKey = stableFeedItemKey(subscription.feedUrl, item.itemIdentifier);
        const existing = existingItems.get(stableKey);
        const productId = existing?.productId ?? `rss-${stableHash(stableKey)}`;
        const itemId = existing?.id ?? `feed-item-${stableHash(stableKey)}`;
        const next: Omit<FeedItem, "importStatus"> = {
          id: itemId,
          stableKey,
          sourceId: subscription.sourceId,
          subscriptionId,
          itemIdentifier: item.itemIdentifier,
          originalUrl: item.originalUrl,
          publishedAt: item.publishedAt,
          title: item.title,
          description: item.description,
          contentType: subscription.category === "OTHER" ? item.contentType : subscription.category,
          author: item.author,
          fetchedAt,
          sourceLanguage: item.sourceLanguage ?? parsed.language,
          productId,
        };
        if (!existing) {
          importedCount += 1;
          nextItems.push({ ...next, importStatus: "IMPORTED" });
        } else if (itemsChanged(existing, next)) {
          updatedCount += 1;
          nextItems.push({ ...next, importStatus: "UPDATED" });
          existingItems.delete(stableKey);
        } else {
          unchangedCount += 1;
          nextItems.push({ ...existing, fetchedAt, importStatus: "UNCHANGED" });
          existingItems.delete(stableKey);
        }
      }
      const retainedItems = [...existingItems.values()];
      const title = subscription.title === new URL(subscription.feedUrl).hostname ? parsed.title : subscription.title;
      const updatedSubscription = { ...subscription, title, updatedAt: now };
      const refreshState: FeedRefreshState = {
        subscriptionId,
        status: result.fromCache ? "STALE" : "READY",
        lastAttemptAt: now,
        lastSuccessAt: fetchedAt,
        failureCount: result.fromCache ? 1 : 0,
        nextAttemptAt: result.fromCache
          ? new Date(this.now().getTime() + BACKOFF_MS[0]).toISOString()
          : new Date(this.now().getTime() + subscription.refreshIntervalMinutes * 60_000).toISOString(),
        importedCount,
        updatedCount,
        unchangedCount,
        usedCache: result.fromCache,
      };
      return {
        state: {
          ...refreshingState,
          feedSources: refreshingState.feedSources.some((source) => source.id === feedSource.id)
            ? refreshingState.feedSources.map((source) => source.id === feedSource.id ? feedSource : source)
            : [...refreshingState.feedSources, feedSource],
          feedSubscriptions: refreshingState.feedSubscriptions.map((entry) => entry.id === subscriptionId ? updatedSubscription : entry),
          feedItems: [...nextItems, ...retainedItems],
          feedRefreshStates: { ...refreshingState.feedRefreshStates, [subscriptionId]: refreshState },
        },
        subscriptionId,
        status: refreshState,
      };
    } catch (error) {
      const failure = failureFrom(error);
      const failureCount = (previous?.failureCount ?? 0) + 1;
      const refreshState: FeedRefreshState = {
        ...(previous ?? { subscriptionId, importedCount: 0, updatedCount: 0, unchangedCount: 0, usedCache: false }),
        subscriptionId,
        status: "BACKOFF",
        lastAttemptAt: now,
        lastSuccessAt: previous?.lastSuccessAt,
        failureCount,
        nextAttemptAt: nextBackoff(failure, failureCount),
        lastFailure: failure,
      };
      return {
        state: {
          ...refreshingState,
          feedRefreshStates: { ...refreshingState.feedRefreshStates, [subscriptionId]: refreshState },
        },
        subscriptionId,
        status: refreshState,
        error: failure,
      };
    }
  }

  async clearFeedCache(feedUrl: string): Promise<void> {
    await this.cache.remove(canonicalizeUrl(assertSafeFeedUrl(feedUrl).toString()));
  }

  async clearAllFeedCache(): Promise<void> {
    await this.cache.clear();
  }
}
