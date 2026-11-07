import type { FeedErrorCode } from "@/types/feed";

export class FeedServiceError extends Error {
  code: FeedErrorCode;
  status?: number;
  retryAfterMs?: number;

  constructor(code: FeedErrorCode, message: string, options: { status?: number; retryAfterMs?: number } = {}) {
    super(message);
    this.name = "FeedServiceError";
    this.code = code;
    this.status = options.status;
    this.retryAfterMs = options.retryAfterMs;
  }
}

export function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

export function isPrivateIpv6(hostname: string): boolean {
  const value = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (value === "::" || value === "::1") return true;
  if (value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb")) return true;
  if (value.startsWith("::ffff:")) return isPrivateIpv4(value.slice(7));
  return false;
}

export function assertSafeFeedUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new FeedServiceError("INVALID_URL", "Enter a complete HTTP or HTTPS feed URL.");
  }
  if (!/^https?:$/.test(url.protocol)) {
    throw new FeedServiceError("BLOCKED_URL", "Only HTTP and HTTPS feed URLs are allowed.");
  }
  if (url.username || url.password) {
    throw new FeedServiceError("BLOCKED_URL", "Feed URLs must not contain usernames, passwords, or tokens.");
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".home.arpa") ||
    isPrivateIpv4(hostname) ||
    isPrivateIpv6(hostname)
  ) {
    throw new FeedServiceError("BLOCKED_URL", "Localhost, private, link-local, and internal feed addresses are blocked.");
  }
  if (url.port === "0") {
    throw new FeedServiceError("BLOCKED_URL", "Port zero is not a valid feed destination.");
  }
  return url;
}

export function canonicalizeUrl(input: string): string {
  const url = new URL(input);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  if ((url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443")) url.port = "";
  const trackingParameters = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"];
  for (const parameter of trackingParameters) url.searchParams.delete(parameter);
  url.searchParams.sort();
  return url.toString();
}

export function safeHttpUrl(input: string | undefined, base?: string): string | undefined {
  if (!input) return undefined;
  try {
    const url = new URL(input.trim(), base);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return undefined;
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal") || isPrivateIpv4(hostname) || isPrivateIpv6(hostname)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function stableHash(value: string): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first ^= code;
    first = Math.imul(first, 0x01000193);
    second ^= code + index;
    second = Math.imul(second, 0x85ebca6b);
  }
  return `${(first >>> 0).toString(36)}${(second >>> 0).toString(36)}`;
}

export function stableFeedItemKey(feedUrl: string, itemIdentifier: string): string {
  return `${canonicalizeUrl(feedUrl)}::${itemIdentifier}`;
}
