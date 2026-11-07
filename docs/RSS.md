# RSS subscriptions

Fitimart imports public RSS 2.0, Atom, and JSON Feed entries as marketplace items. Imported items preserve their source and do not replace curated products or user-created concepts.

## Supported formats

| Format | Common content type | Imported fields |
| --- | --- | --- |
| RSS 2.0 | `application/rss+xml`, `application/xml`, `text/xml` | Channel title/link/language; item GUID or link, title, description/content, publication date, author, categories |
| Atom | `application/atom+xml` | Feed/entry IDs, titles, alternate links, published/updated dates, author names, summary/content, language |
| JSON Feed 1.x | `application/feed+json`, `application/json` | Feed/home URL/language; item ID, URL, title, content/summary, date, authors, tags |

## Subscribe

1. Open **Feeds**.
2. Enter a public `https://` or `http://` feed URL.
3. Optionally provide a display name, choose a marketplace category, simulated item price, and refresh interval.
4. Add the feed. Fitimart validates the URL, fetches it, checks the content type/size/time limit, parses it, and imports usable entries.
5. Open the entry from the feed manager or filter **Marketplace → Source → Subscribed feeds**.

## Deduplication and retention

A stable item key is derived from the canonical feed URL plus, in order of preference:

1. RSS GUID or Atom/JSON Feed item ID.
2. Canonical original item URL.
3. A deterministic hash of title, date, and available content.

The same item keeps the same feed-item ID and product ID across refreshes. Previously imported entries remain locally available when they disappear from a publisher's current feed. The alpha import surface parses at most the newest 40 entries per refresh; raw feed responses are still cached in IndexedDB.

## Refresh policy

- Refresh starts only while an app tab is visible or when the user presses Refresh.
- Due feeds are checked every minute, at most two at a time.
- The minimum configured interval is 15 minutes.
- Successful refresh state includes imported, updated, and unchanged counts.
- Failed refresh state includes the error code, message, attempt time, and next backoff time.
- Repeated failures use a 1 minute, 5 minute, 15 minute, then 60 minute backoff.
- Manual Refresh bypasses backoff.
- Cached valid content is attempted when live fetch fails.

## URL safety

The following are rejected:

- Non-HTTP(S) schemes.
- URLs containing usernames or passwords.
- `localhost`, `.localhost`, `.local`, `.internal`, and `.home.arpa` hostnames.
- Loopback, private, link-local, carrier-grade NAT, documentation/benchmark ranges, multicast, and unspecified IPv4/IPv6 literals.

Browser-side DNS resolution cannot fully prevent DNS rebinding. Do not subscribe to private endpoints even through a public proxy.

## Content safety

- DTD/entity declarations outside CDATA are rejected.
- Feed markup is parsed, dangerous elements are removed, and only textual content is rendered.
- Imported HTML is never injected through `dangerouslySetInnerHTML`.
- Original item links must resolve to safe public HTTP(S) URLs.
- All imported content remains untrusted external data.

## Failure classes

The UI surfaces URL, blocked destination, network/CORS, 404, 429, 5xx, timeout, oversized response, invalid XML, invalid feed, malformed content, proxy failure, and unknown errors. The status also shows whether cache recovery was used.

## Live acceptance feeds

On **2026-11-07**, real-browser acceptance passed with:

- <https://hnrss.org/frontpage> (RSS 2.0)
- <https://github.blog/feed/> (RSS 2.0)
- <https://daringfireball.net/feeds/json> (JSON Feed)
- <https://github.com/atom/atom/releases.atom> (Atom)

These are point-in-time observations, not availability guarantees.
