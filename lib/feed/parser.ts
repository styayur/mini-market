import { XMLParser, XMLValidator } from "fast-xml-parser";
import type { FeedContentType, FeedFormat } from "@/types/feed";
import { FeedServiceError, safeHttpUrl, stableHash } from "./url.ts";
import { sanitizeFeedText, sanitizeFeedTitle } from "./sanitize.ts";

export interface ParsedFeedItem {
  itemIdentifier: string;
  title: string;
  description: string;
  originalUrl?: string;
  publishedAt?: string;
  author?: string;
  sourceLanguage?: string;
  contentType: FeedContentType;
}

export interface ParsedFeed {
  format: Exclude<FeedFormat, "UNKNOWN">;
  title: string;
  homePageUrl?: string;
  language?: string;
  items: ParsedFeedItem[];
}

type XmlValue = unknown;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  textNodeName: "#text",
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  processEntities: true,
  ignoreDeclaration: true,
  ignorePiTags: true,
  removeNSPrefix: false,
});

function arrayOf<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(value: XmlValue): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join(" ");
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record["#text"] !== undefined) return textOf(record["#text"]);
    if (record["@href"] !== undefined) return textOf(record["@href"]);
    return Object.entries(record)
      .filter(([key]) => !key.startsWith("@"))
      .map(([, child]) => textOf(child))
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

function firstText(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = textOf(record[key]).trim();
    if (value) return value;
  }
  return "";
}

function normalizeDate(value: string, fallback?: string): string | undefined {
  if (!value.trim()) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function contentTypeFor(title: string, description: string, categories: string[] = []): FeedContentType {
  const haystack = `${title} ${description} ${categories.join(" ")}`.toLowerCase();
  if (/\b(research|study|paper|journal|experiment|finding|discovery)\b/.test(haystack)) return "RESEARCH";
  if (/\b(project|repository|release|open source|codebase)\b/.test(haystack)) return "PROJECT";
  if (/\b(concept|idea|essay|thought|speculation|proposal)\b/.test(haystack)) return "IDEA";
  if (/\b(product|tool|app|service|marketplace|download|template|plugin)\b/.test(haystack)) return "PRODUCT";
  if (/\b(article|blog|news|post|story|analysis|newsletter)\b/.test(haystack)) return "ARTICLE";
  return "ARTICLE";
}

function itemIdentifierFor(explicit: string, url: string | undefined, title: string, date: string | undefined): string {
  return explicit.trim() || url || stableHash(`${title}:${date ?? ""}`);
}

function safeDescription(html: string | undefined, plain: string | undefined): string {
  return sanitizeFeedText(html || plain || "").slice(0, 4000);
}

function parseRss(root: Record<string, unknown>): ParsedFeed {
  const rss = (root.rss ?? root.RDF ?? root["rdf:RDF"]) as Record<string, unknown> | undefined;
  const channel = rss?.channel as Record<string, unknown> | undefined;
  if (!rss || !channel) throw new FeedServiceError("INVALID_FEED", "This XML document is not an RSS feed.");
  const feedLink = firstText(channel, "link", "atom:link");
  const language = firstText(channel, "language", "dc:language", "@xml:lang") || undefined;
  const items = arrayOf(channel.item ?? rss.item).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const title = sanitizeFeedTitle(firstText(item, "title"));
    if (!title) return [];
    const link = safeHttpUrl(firstText(item, "link"), feedLink || undefined);
    const rawGuid = item.guid;
    const guid = rawGuid && typeof rawGuid === "object" ? textOf((rawGuid as Record<string, unknown>)["#text"]) : textOf(rawGuid);
    const publishedAt = normalizeDate(firstText(item, "pubDate", "dc:date", "published", "updated"));
    const categories = arrayOf(item.category).map(textOf);
    const description = safeDescription(firstText(item, "content:encoded"), firstText(item, "description", "summary"));
    const author = firstText(item, "author", "dc:creator");
    return [{
      itemIdentifier: itemIdentifierFor(guid, link, title, publishedAt),
      title,
      description,
      originalUrl: link,
      publishedAt,
      author: author || undefined,
      sourceLanguage: language,
      contentType: contentTypeFor(title, description, categories),
    }];
  });
  return {
    format: "RSS",
    title: sanitizeFeedTitle(firstText(channel, "title")) || "Untitled RSS feed",
    homePageUrl: safeHttpUrl(feedLink),
    language,
    items,
  };
}

function atomLink(entry: Record<string, unknown>): string | undefined {
  const links = arrayOf(entry.link).flatMap((link) => {
    if (typeof link === "string") return [link];
    if (!link || typeof link !== "object") return [];
    const record = link as Record<string, unknown>;
    const rel = textOf(record["@rel"]);
    const href = textOf(record["@href"]);
    return href && (!rel || rel === "alternate") ? [href] : [];
  });
  return safeHttpUrl(links[0]);
}

function parseAtom(root: Record<string, unknown>): ParsedFeed {
  const feed = root.feed as Record<string, unknown> | undefined;
  if (!feed) throw new FeedServiceError("INVALID_FEED", "This XML document is not an Atom feed.");
  const language = firstText(feed, "@xml:lang") || firstText(feed, "@lang") || undefined;
  const homePageUrl = atomLink(feed);
  const entries = arrayOf(feed.entry).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const title = sanitizeFeedTitle(firstText(item, "title"));
    if (!title) return [];
    const link = atomLink(item);
    const publishedAt = normalizeDate(firstText(item, "published", "updated"));
    const authorRecord = arrayOf(item.author).find((author) => author && typeof author === "object") as Record<string, unknown> | undefined;
    const author = authorRecord ? firstText(authorRecord, "name", "email") : firstText(item, "author");
    const categories = arrayOf(item.category).map((category) => typeof category === "object" ? textOf((category as Record<string, unknown>)["@term"]) : textOf(category));
    const description = safeDescription(firstText(item, "content"), firstText(item, "summary"));
    return [{
      itemIdentifier: itemIdentifierFor(firstText(item, "id"), link, title, publishedAt),
      title,
      description,
      originalUrl: link,
      publishedAt,
      author: author || undefined,
      sourceLanguage: firstText(item, "@xml:lang") || language,
      contentType: contentTypeFor(title, description, categories),
    }];
  });
  return {
    format: "ATOM",
    title: sanitizeFeedTitle(firstText(feed, "title")) || "Untitled Atom feed",
    homePageUrl,
    language,
    items: entries,
  };
}

function jsonAuthor(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return undefined;
  const author = value.find((entry) => entry && typeof entry === "object") as Record<string, unknown> | undefined;
  return author ? textOf(author.name) || textOf(author.url) || undefined : undefined;
}

function parseJsonFeed(body: string): ParsedFeed {
  let document: Record<string, unknown>;
  try {
    document = JSON.parse(body) as Record<string, unknown>;
  } catch {
    throw new FeedServiceError("MALFORMED_CONTENT", "This document is not valid JSON.");
  }
  if (typeof document.version !== "string" || !document.version.startsWith("https://jsonfeed.org/version/")) {
    throw new FeedServiceError("INVALID_FEED", "This JSON document is not a JSON Feed 1.x document.");
  }
  if (!Array.isArray(document.items)) throw new FeedServiceError("INVALID_FEED", "The JSON Feed has no items array.");
  const language = typeof document.language === "string" ? document.language : undefined;
  const items = document.items.slice(0, 500).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const title = sanitizeFeedTitle(typeof item.title === "string" ? item.title : "");
    if (!title) return [];
    const originalUrl = safeHttpUrl(typeof item.url === "string" ? item.url : typeof item.external_url === "string" ? item.external_url : undefined);
    const publishedAt = normalizeDate(typeof item.date_published === "string" ? item.date_published : typeof item.date_modified === "string" ? item.date_modified : "");
    const description = safeDescription(typeof item.content_html === "string" ? item.content_html : undefined, typeof item.content_text === "string" ? item.content_text : typeof item.summary === "string" ? item.summary : undefined);
    const tags = Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === "string") : [];
    return [{
      itemIdentifier: itemIdentifierFor(typeof item.id === "string" ? item.id : "", originalUrl, title, publishedAt),
      title,
      description,
      originalUrl,
      publishedAt,
      author: jsonAuthor(item.authors),
      sourceLanguage: typeof item.language === "string" ? item.language : language,
      contentType: contentTypeFor(title, description, tags),
    }];
  });
  return {
    format: "JSON_FEED",
    title: sanitizeFeedTitle(typeof document.title === "string" ? document.title : "") || "Untitled JSON Feed",
    homePageUrl: typeof document.home_page_url === "string" ? safeHttpUrl(document.home_page_url) : undefined,
    language,
    items,
  };
}

export interface ParseFeedOptions {
  contentType?: string;
  maxItems?: number;
}

export function parseFeed(body: string, options: ParseFeedOptions = {}): ParsedFeed {
  const trimmed = body.replace(/^\uFEFF/, "").trim();
  if (!trimmed) throw new FeedServiceError("MALFORMED_CONTENT", "The feed response was empty.");
  if (trimmed.length > 6 * 1024 * 1024) throw new FeedServiceError("OVERSIZED", "The feed is larger than the 6 MiB safety limit.");
  if (trimmed.startsWith("{") || /json/i.test(options.contentType ?? "") && !trimmed.startsWith("<")) {
    const jsonFeed = parseJsonFeed(trimmed);
    jsonFeed.items = jsonFeed.items.slice(0, options.maxItems ?? 200);
    return jsonFeed;
  }
  const prologWithoutCdata = trimmed.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");
  if (/<!doctype|<!entity/i.test(prologWithoutCdata)) {
    throw new FeedServiceError("INVALID_XML", "Documents with DTD or entity declarations are not accepted.");
  }
  const validation = XMLValidator.validate(trimmed, { allowBooleanAttributes: true });
  if (validation !== true) {
    const message = typeof validation === "object" && validation?.err ? validation.err.msg : "The XML is not well formed.";
    throw new FeedServiceError("INVALID_XML", `Invalid feed XML: ${message}`);
  }
  let document: Record<string, unknown>;
  try {
    document = parser.parse(trimmed) as Record<string, unknown>;
  } catch {
    throw new FeedServiceError("INVALID_XML", "The feed XML could not be parsed.");
  }
  const parsed = document.feed ? parseAtom(document) : parseRss(document);
  parsed.items = parsed.items.slice(0, options.maxItems ?? 200);
  if (!parsed.items.length) throw new FeedServiceError("INVALID_FEED", "The feed contains no usable items.");
  return parsed;
}
