# Contributing

Fitimart is a static, local-first, simulation-only marketplace. Contributions should preserve the interface craft, source attribution, privacy disclosures, and simulation boundary.

## Development environment

Node.js 24 LTS and npm are recommended, matching CI.

```sh
git clone https://github.com/styayur/fitimart.git
cd fitimart
npm ci
npm run dev
```

## Validation

```sh
npm test
npm run typecheck
npm run lint
npm run build
python -m pip install -r scripts/requirements-browser.txt
python scripts/check_browser.py
```

For changes to feed networking, proxy adapters, or translation, also run:

```sh
python tests/live-feeds.spec.py
```

Live acceptance depends on third-party services and is not a deterministic CI gate. Record the date, providers, and failures in the PR.

## Product and security rules

- Wallet, purchase, order, receipt, and concept-support features are simulated only.
- Do not add real payment, cryptocurrency, securities, provider entitlement, or account semantics.
- Keep the app deployable as a static export; do not introduce a required backend.
- RSS/Atom/JSON content is untrusted. Do not inject imported HTML.
- Reject private/local/credential-bearing feed URLs and never forward credentials through public proxies.
- Disclose third-party URL/text exposure whenever adding a provider.
- Preserve legacy Mini Market data through versioned migration.
- Keep monetary calculations exact and JSON-safe.
- Label illustrative metrics and speculative concepts clearly.
- New dependencies and assets require compatible licensing and attribution.

## Pull requests

Use a clear title, explain user-visible and storage effects, and include desktop/mobile screenshots for UI work. Update relevant docs and tests. Maintainers handle releases and Pages deployments.

Security issues follow [SECURITY.md](SECURITY.md), not the public issue tracker.
