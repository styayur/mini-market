# Contributing

Mini Market is a static, local-first product prototype. Contributions should preserve its interface craft without blurring the simulation-only boundary.

## Development environment

Node.js 24 LTS and npm are recommended, matching GitHub Actions.

```bash
git clone https://github.com/styayur/mini-market.git
cd mini-market
npm ci
npm run dev
```

## Validation

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Browser regression scripts are documented in the README. Run them when changing cart, checkout, wallet, persistence, routing, responsive layout, language switching, or accessibility behaviour.

## Product rules

- Token, wallet, purchase, order, receipt, and concept-support features are simulation / experience only.
- Do not add real payment, cryptocurrency, securities, provider credit, or account semantics.
- Keep the app deployable as a static export; do not introduce a required server.
- Label illustrative metrics and future concepts clearly.
- New dependencies and catalog imagery require compatible licensing and source documentation.

## Pull requests

Use a clear title, explain user-visible effects, and include screenshots for UI work. Keep changes focused. Maintainers handle releases and GitHub Pages deployments.

Security issues must follow [SECURITY.md](SECURITY.md), not the public issue tracker.
