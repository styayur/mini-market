import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseFeed } from "../lib/feed/parser.ts";
import { sanitizeFeedText } from "../lib/feed/sanitize.ts";
import { FeedService } from "../lib/feed/feed-service.ts";
import { MemoryFeedCache } from "../lib/feed/feed-cache.ts";
import { ProxyService } from "../lib/feed/proxy-service.ts";
import { assertSafeFeedUrl, canonicalizeUrl, stableFeedItemKey } from "../lib/feed/url.ts";
import { createInitialMarketplaceState, normalizeMarketplaceState } from "../lib/storage.ts";
import { detectBrowserLanguage, resolveLanguage } from "../lib/localization-service.ts";
import { MemoryTranslationCache, TranslationService } from "../lib/translation/translation-service.ts";

const rss = readFileSync(new URL("./fixtures/rss.xml", import.meta.url), "utf8");
const atom = readFileSync(new URL("./fixtures/atom.xml", import.meta.url), "utf8");
const jsonFeed = readFileSync(new URL("./fixtures/json-feed.json", import.meta.url), "utf8");
const headers = (contentType) => ({ "content-type": contentType });
const now = () => new Date("2026-11-07T06:00:00.000Z");

test("parses RSS 2.0 with attribution and sanitized HTML", () => {
  const parsed = parseFeed(rss, { contentType: "application/rss+xml" });
  assert.equal(parsed.format, "RSS");
  assert.equal(parsed.title, "Fixture Research Notes");
  assert.equal(parsed.items.length, 2);
  assert.equal(parsed.items[0].title, "Exact money for tiny markets");
  assert.equal(parsed.items[0].author, "Ada Example");
  assert.equal(parsed.items[0].contentType, "RESEARCH");
  assert.match(parsed.items[0].description, /Exact accounting matters/);
  assert.doesNotMatch(parsed.items[0].description, /script|alert/i);
});

test("parses Atom and JSON Feed, including stable identifiers", () => {
  const atomFeed = parseFeed(atom, { contentType: "application/atom+xml" });
  assert.equal(atomFeed.format, "ATOM");
  assert.equal(atomFeed.items[0].itemIdentifier, "tag:example.org,2026:project-7");
  assert.equal(atomFeed.items[0].author, "Lin Fixture");
  assert.doesNotMatch(atomFeed.items[0].description, /script|alert/i);
  const parsedJson = parseFeed(jsonFeed, { contentType: "application/feed+json" });
  assert.equal(parsedJson.format, "JSON_FEED");
  assert.equal(parsedJson.items[0].itemIdentifier, "json-1");
  assert.equal(parsedJson.items[0].contentType, "IDEA");
  assert.equal(parsedJson.items[0].author, "Rae Fixture");
});

test("rejects malformed XML and malformed JSON Feed", () => {
  assert.throws(() => parseFeed("<rss><channel>", { contentType: "application/rss+xml" }), /Invalid feed XML|not well formed/i);
  assert.throws(() => parseFeed('{"version":"not-json-feed","items":[]}', { contentType: "application/json" }), /JSON Feed/i);
  assert.throws(() => parseFeed("", { contentType: "application/xml" }), /empty/i);
});

test("sanitizes untrusted markup and strips scripts, event attributes, images, and forms", () => {
  const value = sanitizeFeedText('<p onclick="evil()">Safe <strong>text</strong></p><script>alert(1)</script><img src=x onerror="evil()"><form><input value="secret"></form>');
  assert.match(value, /Safe text/);
  assert.doesNotMatch(value, /script|alert|onerror|secret|<img|<form/i);
});

test("rejects credentials, localhost, private networks, and non-HTTP schemes", () => {
  for (const url of ["http://localhost/feed", "http://127.0.0.1/feed", "http://10.1.2.3/feed", "http://[::1]/feed", "file:///tmp/feed.xml", "https://user:pass@example.com/feed"]) {
    assert.throws(() => assertSafeFeedUrl(url));
  }
  assert.equal(assertSafeFeedUrl("https://example.org/feed.xml").hostname, "example.org");
  assert.equal(canonicalizeUrl("https://Example.org:443/feed.xml?utm_source=x#top"), "https://example.org/feed.xml");
  assert.equal(stableFeedItemKey("https://example.org/feed.xml", "one"), stableFeedItemKey("https://example.org/feed.xml", "one"));
});

test("feed service deduplicates repeated items and preserves one subscription", async () => {
  const cache = new MemoryFeedCache();
  const service = new FeedService({
    cache,
    now,
    proxyFactory: () => ({
      fetchFeed: async () => ({ body: rss, contentType: "application/rss+xml", proxyId: "direct", fromCache: false, fetchedAt: now().toISOString(), attempts: [] }),
    }),
  });
  const first = await service.addSubscription(createInitialMarketplaceState(), {
    feedUrl: "https://example.org/research.xml",
    title: "Research",
    category: "RESEARCH",
    priceAtomic: "25000000",
    refreshIntervalMinutes: 60,
  });
  assert.equal(first.state.feedSubscriptions.length, 1);
  assert.equal(first.state.feedItems.length, 2);
  assert.equal(first.status.importedCount, 2);
  const second = await service.addSubscription(first.state, {
    feedUrl: "https://example.org/research.xml",
    title: "Research",
    category: "RESEARCH",
    priceAtomic: "25000000",
    refreshIntervalMinutes: 60,
  });
  assert.equal(second.state.feedSubscriptions.length, 1);
  assert.equal(second.state.feedItems.length, 2);
  assert.equal(second.status.unchangedCount, 2);
  assert.equal(second.state.feedItems[0].productId, first.state.feedItems[0].productId);
});

test("proxy adapter fallback tries direct, then configured alternatives, and recovers cache", async () => {
  const calls = [];
  const cache = new MemoryFeedCache();
  const service = new ProxyService({
    proxySettings: { enabledAdapterIds: ["direct", "cors-dev", "cors-tools"] },
    cache,
    validate: (body, contentType) => { parseFeed(body, { contentType }); },
    fetchImpl: async (url) => {
      calls.push(String(url));
      if (String(url).startsWith("https://feeds.example.org/")) throw new TypeError("CORS blocked");
      if (String(url).includes("proxy.cors.dev")) return new Response("<html>proxy error</html>", { status: 200, headers: headers("text/html") });
      return new Response(rss, { status: 200, headers: headers("application/rss+xml") });
    },
    now,
  });
  const result = await service.fetchFeed("https://feeds.example.org/feed.xml");
  assert.equal(result.proxyId, "cors-tools");
  assert.equal(result.fromCache, false);
  assert.equal(result.attempts.filter((attempt) => !attempt.ok).length, 2);
  assert.equal(calls.length, 3);

  const cached = new MemoryFeedCache();
  await cached.set({ feedUrl: "https://feeds.example.org/cached.xml", body: rss, contentType: "application/rss+xml", fetchedAt: now().toISOString(), source: "PROXY", proxyId: "cors-dev" });
  const recovery = new ProxyService({
    proxySettings: { enabledAdapterIds: ["direct"] },
    cache: cached,
    validate: (body, contentType) => { parseFeed(body, { contentType }); },
    fetchImpl: async () => { throw new TypeError("offline"); },
    now,
  });
  const recovered = await recovery.fetchFeed("https://feeds.example.org/cached.xml");
  assert.equal(recovered.fromCache, true);
  assert.equal(recovered.proxyId, "cors-dev");
});

test("HTTP errors are surfaced with bounded proxy fallback", async () => {
  for (const [status, code] of [[404, "HTTP_404"], [429, "HTTP_429"], [503, "HTTP_5XX"]]) {
    let calls = 0;
    const service = new ProxyService({
      proxySettings: { enabledAdapterIds: ["direct", "cors-dev", "cors-tools"] },
      cache: new MemoryFeedCache(),
      fetchImpl: async () => { calls += 1; return new Response("", { status, headers: status === 429 ? { "retry-after": "60" } : {} }); },
      now,
    });
    await assert.rejects(() => service.fetchFeed("https://feeds.example.org/error.xml"), (error) => error.code === code);
    assert.equal(calls, status === 503 ? 3 : 1);
  }
});

test("legacy Mini Market storage migrates balances, orders, favorites, concepts, and backings", () => {
  const legacy = {
    credits: 10000,
    cartProductIds: ["openai-api"],
    favoriteProductIds: ["openai-api"],
    watchedConceptIds: ["universal-memory-api"],
    libraryProductIds: ["openai-api"],
    createdConcepts: [{ id: "local", slug: "local", name: "Local", demoPrice: 0, backingCredits: 12 }],
    orders: [{ id: "order-1", createdAt: "2026-01-01T00:00:00Z", total: 480, balanceAfter: 9520, items: [{ productId: "openai-api", name: "OpenAI API", quantity: 1, unitPrice: 480 }] }],
    transactions: [{ id: "tx", userId: "demo-user", productId: "openai-api", quantity: 1, creditsSpent: 480, createdAt: "2026-01-01T00:00:00Z", status: "COMPLETED" }],
    backings: [{ id: "back", conceptId: "universal-memory-api", userId: "demo-user", credits: 200, createdAt: "2026-01-01T00:00:00Z" }],
    conceptBackingTotals: { "universal-memory-api": 200 },
  };
  const result = normalizeMarketplaceState(legacy);
  assert.equal(result.migrated, true);
  assert.equal(result.state.wallet.balanceAtomic, "10000000000");
  assert.equal(result.state.economy.initialCreditAtomic, "1000000000000000000");
  assert.equal(result.state.orders[0].totalAtomic, "480000000");
  assert.equal(result.state.orders[0].balanceAfterAtomic, "9520000000");
  assert.equal(result.state.transactions[0].amountAtomic, "480000000");
  assert.deepEqual(result.state.favoriteProductIds, ["openai-api"]);
  assert.deepEqual(result.state.watchedConceptIds, ["universal-memory-api"]);
  assert.equal(result.state.createdConcepts[0].origin.kind, "USER");
  assert.equal(result.state.backings[0].amountAtomic, "200000000");
  assert.equal(result.state.conceptBackingTotals["universal-memory-api"], "200000000");
});

test("browser language preference and fallback order are deterministic", () => {
  assert.equal(detectBrowserLanguage(["fr-FR", "zh-HK", "en-US"]), "zh");
  assert.equal(detectBrowserLanguage(["fr-FR", "de-DE"]), "en");
  assert.deepEqual(resolveLanguage({ queryLanguage: "zh-CN", savedPreference: "en", browserLanguages: ["en-US"] }), { language: "zh", preference: "zh", source: "query" });
  assert.deepEqual(resolveLanguage({ savedPreference: "en", browserLanguages: ["zh-CN"] }), { language: "en", preference: "en", source: "saved" });
  assert.deepEqual(resolveLanguage({ savedPreference: "auto", browserLanguages: ["zh-CN"] }), { language: "zh", preference: "auto", source: "browser" });
});

test("translation preserves original text and caches successful results", async () => {
  let calls = 0;
  const provider = {
    id: "mymemory",
    label: "fixture",
    documentationUrl: "https://example.org",
    limits: "fixture",
    async translate(request) {
      calls += 1;
      return { text: `translated:${request.text}`, translated: true, provider: "mymemory" };
    },
  };
  const service = new TranslationService(provider, new MemoryTranslationCache());
  const first = await service.translate("hello", "en", "zh-CN");
  const second = await service.translate("hello", "en", "zh-CN");
  assert.equal(first.text, "translated:hello");
  assert.equal(second.cached, true);
  assert.equal(calls, 1);

  const failureProvider = {
    id: "mymemory",
    label: "fixture",
    documentationUrl: "https://example.org",
    limits: "fixture",
    async translate(request) { return { text: request.text, translated: false, provider: "mymemory", error: "quota" }; },
  };
  const fallback = await new TranslationService(failureProvider, new MemoryTranslationCache()).translate("original", "en", "zh-CN");
  assert.equal(fallback.text, "original");
  assert.equal(fallback.translated, false);
  assert.equal(fallback.error, "quota");
});
