# Changelog

All notable changes are documented here. Fitimart is an experimental simulation project and does not follow a stable API or financial-data guarantee.

## [0.2.0-alpha.1] — 2026-11-07

### Added

- Fitimart identity, package metadata, documentation, and Pages path.
- RSS 2.0, Atom, and JSON Feed subscription manager.
- Feed source, subscription, item, refresh state, and product provenance models.
- Direct fetch, configurable public CORS proxy adapters, custom proxy template, validation, size/timeout limits, backoff, and cached-content recovery.
- IndexedDB raw feed cache and translation cache.
- RSS-derived marketplace products and a static-compatible imported-product detail route.
- Exact six-decimal atomic money using BigInt internally and strings in persisted JSON.
- Configurable initial credit, ISO 4217/custom currency display, precision, and pattern.
- Wallet reset adjustment records that preserve ledger history.
- Browser-language detection, manual override, English and Simplified Chinese interface support.
- Optional MyMemory translation with original-text fallback.
- Gold-coin purchase celebration, animated balance, and reduced-motion behavior.
- Schema v2 storage, legacy migration, migration backups, and JSON export/import.
- Deterministic feed, money, storage, proxy, translation, and localization tests.
- Offline Chromium acceptance and separate live-service acceptance.
- GitHub Pages subpath verification.
- Scheduled/manual live-feed workflow and tagged release workflow.

### Changed

- Local active storage key is `fitimart-marketplace-v2`; `mini-market-demo-v1` remains migration-only.
- Default wallet initialization uses exact `1,000,000,000,000 USD`.
- Cart, checkout, receipt, backing, wallet, and product calculations use atomic strings.
- Pages workflow name and deployment URL now target Fitimart.

### Preserved

- Curated catalogue and future concepts.
- Existing balances and ledger records through migration.
- Favorites, watched concepts, collections, user concepts, cart, and backings.
- Simulation-only commerce boundary.

### Known limitations

- Public proxy and translation availability is not guaranteed.
- Imported feed parsing retains the newest 40 entries per refresh.
- No backend authority, cross-device sync, or inter-tab transaction lock.
- Interface localization is currently English and Simplified Chinese.
