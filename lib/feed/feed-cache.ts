import type { FeedCacheEntry } from "@/types/feed";
import type { FeedCache } from "./proxy-service.ts";

const DB_NAME = "fitimart-feed-cache";
const DB_VERSION = 1;
const STORE_NAME = "feed-responses";
const FALLBACK_KEY = "fitimart-feed-cache-fallback-v1";
const MAX_ENTRIES = 30;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is unavailable."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Could not open feed cache."));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "feedUrl" });
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => Promise<T> | T): Promise<T> {
  const database = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    let result: T;
    try {
      result = action(store) as T;
    } catch (error) {
      transaction.abort();
      reject(error);
      return;
    }
    transaction.oncomplete = () => {
      database.close();
      resolve(result);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Feed cache transaction failed."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Feed cache transaction was aborted."));
    };
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Feed cache request failed."));
  });
}

export class IndexedDbFeedCache implements FeedCache {
  async get(feedUrl: string): Promise<FeedCacheEntry | undefined> {
    try {
      const database = await openDatabase();
      const transaction = database.transaction(STORE_NAME, "readonly");
      const value = await requestResult(transaction.objectStore(STORE_NAME).get(feedUrl) as IDBRequest<FeedCacheEntry | undefined>);
      database.close();
      return value;
    } catch {
      return this.readFallback(feedUrl);
    }
  }

  async set(entry: FeedCacheEntry): Promise<void> {
    try {
      await withStore("readwrite", (store) => {
        store.put(entry);
      });
      await this.trim();
    } catch {
      this.writeFallback(entry);
    }
  }

  async remove(feedUrl: string): Promise<void> {
    try {
      await withStore("readwrite", (store) => {
        store.delete(feedUrl);
      });
    } catch {
      // Fall through to localStorage cleanup.
    }
    this.removeFallback(feedUrl);
  }

  async clear(): Promise<void> {
    try {
      await withStore("readwrite", (store) => {
        store.clear();
      });
    } catch {
      // A fallback clear still runs below.
    }
    try {
      localStorage.removeItem(FALLBACK_KEY);
    } catch {
      // Storage can be unavailable.
    }
  }

  private async trim(): Promise<void> {
    try {
      const database = await openDatabase();
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const entries = await requestResult(store.getAll() as IDBRequest<FeedCacheEntry[]>);
      if (entries.length > MAX_ENTRIES) {
        entries
          .sort((a, b) => a.fetchedAt.localeCompare(b.fetchedAt))
          .slice(0, entries.length - MAX_ENTRIES)
          .forEach((entry) => store.delete(entry.feedUrl));
      }
      database.close();
    } catch {
      // Trimming is best effort.
    }
  }

  private readFallback(feedUrl: string): FeedCacheEntry | undefined {
    try {
      const raw = localStorage.getItem(FALLBACK_KEY);
      if (!raw) return undefined;
      const entries = JSON.parse(raw) as Record<string, FeedCacheEntry>;
      return entries[feedUrl];
    } catch {
      return undefined;
    }
  }

  private writeFallback(entry: FeedCacheEntry): void {
    try {
      const raw = localStorage.getItem(FALLBACK_KEY);
      const entries = raw ? JSON.parse(raw) as Record<string, FeedCacheEntry> : {};
      entries[entry.feedUrl] = entry;
      const sorted = Object.entries(entries)
        .sort(([, a], [, b]) => b.fetchedAt.localeCompare(a.fetchedAt))
        .slice(0, 5);
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(Object.fromEntries(sorted)));
    } catch {
      // The cache is optional; live refresh can still work.
    }
  }

  private removeFallback(feedUrl: string): void {
    try {
      const raw = localStorage.getItem(FALLBACK_KEY);
      if (!raw) return;
      const entries = JSON.parse(raw) as Record<string, FeedCacheEntry>;
      delete entries[feedUrl];
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(entries));
    } catch {
      // Best effort.
    }
  }
}

export class MemoryFeedCache implements FeedCache {
  private entries = new Map<string, FeedCacheEntry>();

  async get(feedUrl: string) {
    return this.entries.get(feedUrl);
  }

  async set(entry: FeedCacheEntry) {
    this.entries.set(entry.feedUrl, entry);
  }

  async remove(feedUrl: string) {
    this.entries.delete(feedUrl);
  }

  async clear() {
    this.entries.clear();
  }
}
