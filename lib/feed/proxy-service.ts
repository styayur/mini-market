import type { FeedCacheEntry, ProxyAdapterId, ProxySettings } from "@/types/feed";
import { FeedServiceError, assertSafeFeedUrl } from "./url.ts";

export interface FeedCache {
  get(feedUrl: string): Promise<FeedCacheEntry | undefined>;
  set(entry: FeedCacheEntry): Promise<void>;
  remove(feedUrl: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ProxyAdapter {
  id: ProxyAdapterId;
  label: string;
  description: string;
  buildUrl(target: URL): string;
  privacyUrl?: string;
  documentationUrl?: string;
  verifiedAt?: string;
  limits?: string;
}

export const PROXY_ADAPTERS: ProxyAdapter[] = [
  {
    id: "direct",
    label: "Direct browser request",
    description: "Fetches the publisher directly. This only works when the feed permits its origin in CORS.",
    buildUrl: (target) => target.toString(),
    limits: "Publisher-controlled availability and CORS policy",
  },
  {
    id: "cors-dev",
    label: "cors.dev",
    description: "Keyless public proxy; requests are made by its server with a 6 MiB cap and 30-second upstream deadline.",
    buildUrl: (target) => `https://proxy.cors.dev/${target.toString()}`,
    privacyUrl: "https://cors.dev/privacy",
    documentationUrl: "https://cors.dev/",
    verifiedAt: "2026-11-07",
    limits: "Anonymous: 600 requests/minute/IP, 6 MiB response, GET/HEAD",
  },
  {
    id: "cors-tools",
    label: "cors.tools",
    description: "Keyless public proxy and reader that records every request and response, according to its data notice. Opt in only for public feed content.",
    buildUrl: (target) => `https://cors.tools/${target.toString()}`,
    documentationUrl: "https://cors.tools/",
    verifiedAt: "2026-11-07",
    limits: "Public fair-use service; no uptime or quota guarantee",
  },
];

export interface ProxyFetchResult {
  body: string;
  contentType?: string;
  proxyId: ProxyAdapterId;
  fromCache: boolean;
  fetchedAt: string;
  attempts: Array<{ proxyId: ProxyAdapterId; ok: boolean; code?: string; message?: string }>;
}

export interface ProxyFetchOptions {
  proxySettings: ProxySettings;
  cache: FeedCache;
  validate?: (body: string, contentType?: string) => void;
  timeoutMs?: number;
  maxBytes?: number;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

async function readWithLimit(response: Response, maxBytes: number): Promise<string> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new FeedServiceError("OVERSIZED", `The feed response exceeds the ${Math.round(maxBytes / 1024 / 1024)} MiB limit.`);
  }
  if (!response.body) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      throw new FeedServiceError("OVERSIZED", `The feed response exceeds the ${Math.round(maxBytes / 1024 / 1024)} MiB limit.`);
    }
    return text;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new FeedServiceError("OVERSIZED", `The feed response exceeds the ${Math.round(maxBytes / 1024 / 1024)} MiB limit.`);
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

function httpError(response: Response): FeedServiceError {
  const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
  if (response.status === 404) return new FeedServiceError("HTTP_404", "The feed was not found (404).", { status: 404 });
  if (response.status === 429) return new FeedServiceError("HTTP_429", "The feed or proxy is rate limited (429).", { status: 429, retryAfterMs });
  if (response.status >= 500) return new FeedServiceError("HTTP_5XX", `The feed server returned ${response.status}.`, { status: response.status, retryAfterMs });
  return new FeedServiceError("HTTP_ERROR", `The feed request failed with HTTP ${response.status}.`, { status: response.status, retryAfterMs });
}

function customAdapter(settings: ProxySettings): ProxyAdapter | undefined {
  if (!settings.customAdapter?.enabled) return undefined;
  const template = settings.customAdapter.template.trim();
  if (!template.includes("{url}")) return undefined;
  try {
    const probe = template.replaceAll("{url}", "https%3A%2F%2Fexample.com%2Ffeed.xml");
    if (!probe.startsWith("https://")) return undefined;
    return {
      id: "custom",
      label: settings.customAdapter.label || "Custom proxy",
      description: "User-configured public CORS proxy. Fitimart does not verify this endpoint.",
      buildUrl: (target) => template.replaceAll("{url}", encodeURIComponent(target.toString())),
    };
  } catch {
    return undefined;
  }
}

export class ProxyService {
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => Date;
  private readonly options: ProxyFetchOptions;

  constructor(options: ProxyFetchOptions) {
    this.options = options;
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
    this.now = options.now ?? (() => new Date());
  }

  private adapters(): ProxyAdapter[] {
    const selected = new Set(this.options.proxySettings.enabledAdapterIds);
    const adapters = PROXY_ADAPTERS.filter((adapter) => adapter.id === "direct" || selected.has(adapter.id));
    const custom = customAdapter(this.options.proxySettings);
    if (custom && selected.has("custom")) adapters.push(custom);
    return adapters;
  }

  private async attempt(adapter: ProxyAdapter, target: URL, timeoutMs: number, maxBytes: number) {
    if (adapter.id !== "direct" && !/^https:\/\//.test(adapter.buildUrl(target))) {
      throw new FeedServiceError("PROXY_FAILURE", "The proxy endpoint must use HTTPS.");
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await this.fetchImpl(adapter.buildUrl(target), {
        method: "GET",
        headers: { Accept: "application/rss+xml, application/atom+xml, application/feed+json, application/json, application/xml, text/xml;q=0.9, */*;q=0.5" },
        signal: controller.signal,
        credentials: "omit",
        redirect: "follow",
        referrerPolicy: "no-referrer",
      });
      if (!response.ok) throw httpError(response);
      const body = await readWithLimit(response, maxBytes);
      const contentType = response.headers.get("content-type") ?? undefined;
      const corsError = response.headers.get("x-cors-error");
      if (corsError) throw new FeedServiceError("PROXY_FAILURE", `The proxy rejected the request: ${corsError}.`, { status: response.status });
      this.options.validate?.(body, contentType);
      return { body, contentType };
    } catch (error) {
      if (error instanceof FeedServiceError) throw error;
      if (controller.signal.aborted) {
        throw new FeedServiceError("TIMEOUT", `The feed request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
      }
      if (adapter.id === "direct") {
        throw new FeedServiceError("CORS", "The direct request was blocked by CORS or failed at the network layer. Trying public proxies next.");
      }
      const detail = error instanceof Error && error.message ? ` ${error.message}` : "";
      throw new FeedServiceError("PROXY_FAILURE", `${adapter.label} could not retrieve the feed.${detail}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  async fetchFeed(input: string): Promise<ProxyFetchResult> {
    const target = assertSafeFeedUrl(input);
    const canonical = target.toString();
    const timeoutMs = this.options.timeoutMs ?? 20_000;
    const maxBytes = this.options.maxBytes ?? 6 * 1024 * 1024;
    const attempts: ProxyFetchResult["attempts"] = [];
    let lastError: FeedServiceError | undefined;

    for (const adapter of this.adapters()) {
      try {
        const result = await this.attempt(adapter, target, timeoutMs, maxBytes);
        const fetchedAt = this.now().toISOString();
        const entry: FeedCacheEntry = {
          feedUrl: canonical,
          body: result.body,
          contentType: result.contentType,
          fetchedAt,
          source: adapter.id === "direct" ? "DIRECT" : "PROXY",
          proxyId: adapter.id,
        };
        await this.options.cache.set(entry).catch(() => undefined);
        attempts.push({ proxyId: adapter.id, ok: true });
        return { ...result, proxyId: adapter.id, fromCache: false, fetchedAt, attempts };
      } catch (error) {
        const failure = error instanceof FeedServiceError ? error : new FeedServiceError("UNKNOWN", "The feed could not be retrieved.");
        attempts.push({ proxyId: adapter.id, ok: false, code: failure.code, message: failure.message });
        lastError = failure;
        const definitive = failure.code === "HTTP_404" || failure.code === "HTTP_429" || failure.code === "OVERSIZED";
        if (definitive) break;
      }
    }

    try {
      const cached = await this.options.cache.get(canonical);
      if (cached) {
        this.options.validate?.(cached.body, cached.contentType);
        attempts.push({ proxyId: cached.proxyId ?? "direct", ok: true, message: "Recovered from local cache" });
        return {
          body: cached.body,
          contentType: cached.contentType,
          proxyId: cached.proxyId ?? "direct",
          fromCache: true,
          fetchedAt: cached.fetchedAt,
          attempts,
        };
      }
    } catch (error) {
      if (error instanceof FeedServiceError) lastError = error;
    }

    const failure = lastError ?? new FeedServiceError("PROXY_FAILURE", "No configured proxy could retrieve the feed.");
    failure.message = attempts.length > 1
      ? `${failure.message} ${attempts.map((attempt) => `${attempt.proxyId}: ${attempt.code ?? "failed"}`).join("; ")}.`
      : failure.message;
    throw failure;
  }
}
