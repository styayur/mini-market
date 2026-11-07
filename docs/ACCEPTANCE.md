# Acceptance and release evidence

## Deterministic automated tests

`npm test` uses local fixtures and does not depend on public services. Current coverage includes:

- RSS 2.0 parsing
- Atom parsing
- JSON Feed 1.1 parsing
- stable item identity and deduplication
- direct request → configured proxy → alternative proxy fallback
- 404, 429, and 5xx handling
- cached-response recovery
- invalid, local, private, and credential-bearing URLs
- script and HTML sanitization
- currency parsing/formatting with one-trillion-unit balances
- exact settlement, quantities, insufficient funds, and zero-price items
- duplicate settlement prevention
- legacy storage migration
- initial-credit and explicit wallet-reset behavior
- browser-language resolution and saved override priority
- translation success, caching, and original-text fallback
- JSON-safe export/import

Result on 2026-11-07: **24 tests passed, 0 failed**.

## Offline browser acceptance

`python scripts/check_browser.py` serves the built static export and blocks all remote requests. It verifies:

- fresh browser profile
- browser-language detection and persisted manual override
- exact `10^12` wallet initialization
- purchase with exact atomic debit
- gold-coin animation and animated balance
- receipt download
- rapid double-click settlement guard
- collection update and reload persistence
- initial-credit edit that leaves the current wallet untouched
- invalid/private feed URL rejection
- legacy Mini Market profile migration
- responsive layouts at 390 px and 768 px

Result on 2026-11-07: **passed** with no remote requests and no page errors.

## GitHub Pages subpath acceptance

`NEXT_PUBLIC_BASE_PATH=/fitimart npm run build` followed by `python tests/pages-subpath.spec.py` serves the export under `/fitimart/`.

Result on 2026-11-07: **passed** for CSS/JS assets, home, Marketplace, Feeds, Settings, the static query-based imported-product route, and responsive layout.

## Live-service browser acceptance

`python tests/live-feeds.spec.py` uses real third-party services. It is intentionally separate from deterministic CI.

Passed services on 2026-11-07:

| Service | Result |
| --- | --- |
| Hacker News RSS / hnrss.org | HTTP 200, imported |
| GitHub Blog RSS | HTTP 200, imported |
| Daring Fireball JSON Feed | HTTP 200, imported |
| GitHub Atom releases feed | HTTP 200, imported |
| cors.dev | HTTP 200, valid RSS through browser CORS |
| cors.tools | HTTP 200, valid RSS through browser CORS; opt-in due to its data-retention notice |
| MyMemory | live translation rendered in the browser UI |

The run also created 80 RSS-derived marketplace products, filtered them in the Marketplace, added an RSS product to the bag, and recorded no page errors.

The same live-service suite also passed against the deployed production URL <https://styayur.github.io/fitimart/> using the actual /fitimart/ base path. The committed live report records that production base URL.

Evidence:

- `docs/evidence/live-feeds.png`
- `docs/evidence/live-feeds.json`
- `docs/evidence/offline-browser.json`

## CI

The repository workflow runs `npm ci`, dependency audit at high severity, unit tests, type checking, linting, root static build, offline browser acceptance, Pages-subpath build, and subpath acceptance. Live-service acceptance runs separately by schedule or manual dispatch.

## Limits

- External results are point-in-time observations.
- No third-party uptime, quota, translation quality, or language coverage is promised.
- Tests use disposable browser state and do not represent a real financial system.
- Multi-tab settlement and cross-device synchronization remain out of scope.
