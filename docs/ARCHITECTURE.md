# Fitimart architecture

## Scope

Fitimart is a static Next.js export. It has no application backend, account system, payment gateway, or server-side settlement authority. Browser storage owns the simulated wallet, collection, imported feed metadata, and caches.

## Data flow

```text
curated data ───────────────┐
user concepts ──────────────┼──> CatalogService ──> typed storefront products
FeedService ──> FeedItem ───┘
     │
     ├── ProxyService ──> direct fetch
     │                    configured public proxy
     │                    alternative public proxy
     │                    IndexedDB cached response
     └── parser ──> RSS / Atom / JSON Feed ──> dedupe ──> refresh state
```

```text
storefront
  ├── WalletService ──> exact balance and top-ups
  ├── OrderService ───> pure exact settlement
  ├── CollectionService
  ├── LocalizationService ──> UI language resolution
  └── TranslationService ──> replaceable provider ──> IndexedDB cache
```

## Service boundaries

| Service | Responsibility |
| --- | --- |
| `CatalogService` | Merge curated and RSS items into a typed product view, preserving source provenance and retained items. |
| `FeedService` | Validate subscriptions, fetch/parse, deduplicate stable item keys, enforce refresh policy, retain old items, expose status and backoff. |
| `ProxyService` | Direct request first, then only enabled public adapters, with timeout, response-size, HTTP, CORS, malformed-content, and cache recovery handling. |
| `WalletService` | Exact top-ups, backing deductions, economy validation, and display-only currency changes. |
| `OrderService` | Pure order settlement wrapper over `settleOrder`. |
| `CollectionService` | Cart, favorites, watched concepts, and library mutations. |
| `LocalizationService` | Browser-language resolution and deterministic fallback order. |
| `TranslationService` | Replaceable content provider, successful-result caching, and original-text fallback. |
| `StorageService` | Versioned local state, migration, backup, export, and import delivery. |

## Persisted state

Active state lives under `fitimart-marketplace-v2` with `schemaVersion: 2`. Monetary fields are integer strings in six-decimal atomic units. No BigInt is serialized.

```text
wallet + economy settings
cart + orders + top-ups + wallet adjustments
favorites + watched concepts + library + user concepts
transactions + backings + backing totals
feed sources + subscriptions + items + refresh states
proxy settings + translation settings + language preference
migration warnings
```

Raw feed responses and translation cache entries live in IndexedDB. Local storage keeps bounded imported-item metadata so subscriptions can render after reload.

## Purchase transaction

1. The checkout button is disabled until the simulation notice is accepted and the exact atomic total is covered.
2. `settleOrder` recomputes the total from catalog prices and quantities.
3. A synchronous provider lock rejects an overlapping settlement attempt.
4. The provider commits the new wallet, order, transactions, library, and empty bag as one state object.
5. Only a successful result renders the coin animation and balance animation.
6. Receipt download uses the order snapshot and exact atomic values.

The lock is scoped to one browser tab. It is not an inter-tab transaction authority.

## Feed refresh policy

- Manual refresh is always available.
- Due feeds are checked at most two at a time while an app tab is visible.
- The browser checks every minute; a feed's configured interval is at least 15 minutes.
- No refresh runs while the browser is closed.
- Failures use exponential backoff and remain visible in the feed status.
- Cached content is attempted when live providers fail.

## Security model

- Only public HTTP(S) feed URLs are accepted.
- Credentials, localhost, private/link-local IP literals, internal hostnames, and non-HTTP schemes are rejected.
- Feed XML rejects DTD/entity declarations outside CDATA.
- Imported HTML is reduced to sanitized text and never inserted through `dangerouslySetInnerHTML`.
- Item links are limited to safe HTTP(S) URLs.
- Proxies and translation receive only public content explicitly submitted by the user.
- The simulation never requests API keys or sends authorization headers.
