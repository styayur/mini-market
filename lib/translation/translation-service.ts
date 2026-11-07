import type { TranslationProviderId } from "@/types/marketplace";
import { stableHash } from "../feed/url.ts";

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslationResult {
  text: string;
  translated: boolean;
  provider: TranslationProviderId;
  cached?: boolean;
  error?: string;
}

export interface TranslationProvider {
  id: Exclude<TranslationProviderId, "none">;
  label: string;
  documentationUrl: string;
  limits: string;
  translate(request: TranslationRequest): Promise<TranslationResult>;
}

export function normalizeLanguageCode(value: string | undefined): string {
  if (!value) return "en";
  const normalized = value.trim().replace("_", "-").toLowerCase();
  if (normalized.startsWith("zh")) return normalized.includes("tw") || normalized.includes("hk") ? "zh-TW" : "zh-CN";
  return normalized.split("-")[0] || "en";
}

export class MyMemoryTranslationProvider implements TranslationProvider {
  id = "mymemory" as const;
  label = "MyMemory";
  documentationUrl = "https://mymemory.translated.net/doc/spec.php";
  limits = "Anonymous: 5,000 characters/day; no API key; public machine translation";
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: { fetchImpl?: typeof fetch; timeoutMs?: number } = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const source = normalizeLanguageCode(request.sourceLanguage);
    const target = normalizeLanguageCode(request.targetLanguage);
    if (!request.text.trim() || source === target) {
      return { text: request.text, translated: false, provider: this.id, cached: false };
    }
    const chunks: string[] = [];
    let remaining = request.text;
    while (remaining && chunks.length < 10) {
      if (remaining.length <= 450) {
        chunks.push(remaining);
        break;
      }
      let splitAt = remaining.lastIndexOf(" ", 450);
      if (splitAt < 200) splitAt = 450;
      chunks.push(remaining.slice(0, splitAt).trim());
      remaining = remaining.slice(splitAt).trim();
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const translatedChunks: string[] = [];
      for (const text of chunks) {
        const url = new URL("https://api.mymemory.translated.net/get");
        url.searchParams.set("q", text);
        url.searchParams.set("langpair", `${source}|${target}`);
        const response = await this.fetchImpl(url, {
          signal: controller.signal,
          credentials: "omit",
          referrerPolicy: "no-referrer",
        });
        if (!response.ok) throw new Error(`Translation service returned HTTP ${response.status}.`);
        const payload = await response.json() as {
          responseStatus?: number | string;
          responseDetails?: string;
          responseData?: { translatedText?: string };
        };
        const translatedText = payload.responseData?.translatedText?.trim();
        if ((payload.responseStatus !== undefined && Number(payload.responseStatus) !== 200) || !translatedText) {
          throw new Error(payload.responseDetails || "Translation service returned no translation.");
        }
        translatedChunks.push(translatedText);
      }
      return { text: translatedChunks.join(" "), translated: true, provider: this.id, cached: false };
    } catch (error) {
      return {
        text: request.text,
        translated: false,
        provider: this.id,
        cached: false,
        error: error instanceof Error ? error.message : "Translation failed.",
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export interface TranslationCache {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryTranslationCache implements TranslationCache {
  private values = new Map<string, string>();
  async get(key: string) { return this.values.get(key); }
  async set(key: string, value: string) { this.values.set(key, value); }
  async clear() { this.values.clear(); }
}

function openTranslationDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is unavailable."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("fitimart-translation-cache", 1);
    request.onerror = () => reject(request.error ?? new Error("Could not open translation cache."));
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("translations")) request.result.createObjectStore("translations");
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export class IndexedDbTranslationCache implements TranslationCache {
  async get(key: string): Promise<string | undefined> {
    try {
      const database = await openTranslationDatabase();
      return await new Promise((resolve, reject) => {
        const request = database.transaction("translations", "readonly").objectStore("translations").get(key);
        request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : undefined);
        request.onerror = () => reject(request.error);
        request.transaction?.addEventListener("complete", () => database.close());
      });
    } catch {
      return undefined;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      const database = await openTranslationDatabase();
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction("translations", "readwrite");
        transaction.objectStore("translations").put(value, key);
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
      });
    } catch {
      // Translation remains available without caching.
    }
  }

  async clear(): Promise<void> {
    try {
      const database = await openTranslationDatabase();
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction("translations", "readwrite");
        transaction.objectStore("translations").clear();
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
      });
    } catch {
      // Best effort.
    }
  }
}

export class TranslationService {
  private readonly provider: TranslationProvider | null;
  private readonly cache: TranslationCache;

  constructor(provider: TranslationProvider | null, cache: TranslationCache = new IndexedDbTranslationCache()) {
    this.provider = provider;
    this.cache = cache;
  }

  async translate(text: string, sourceLanguage: string, targetLanguage: string): Promise<TranslationResult> {
    if (!this.provider) return { text, translated: false, provider: "none" };
    const source = normalizeLanguageCode(sourceLanguage);
    const target = normalizeLanguageCode(targetLanguage);
    if (source === target) return { text, translated: false, provider: this.provider.id };
    const key = `${this.provider.id}:${source}:${target}:${stableHash(text)}:${text.length}`;
    const cached = await this.cache.get(key);
    if (cached) return { text: cached, translated: true, provider: this.provider.id, cached: true };
    const result = await this.provider.translate({ text, sourceLanguage: source, targetLanguage: target });
    if (result.translated) await this.cache.set(key, result.text);
    return result;
  }

  async clearCache() {
    await this.cache.clear();
  }
}

export const translationService = new TranslationService(new MyMemoryTranslationProvider());
