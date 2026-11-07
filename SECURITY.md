# Security Policy

## Supported version

Security fixes target the current `main` branch and the latest published GitHub Pages deployment.

## Report privately

Do not report exploitable issues in a public issue. Use GitHub private vulnerability reporting:

https://github.com/styayur/fitimart/security/advisories/new

Include the affected route, browser/OS, reproduction steps, impact, and minimal proof of concept. Remove private browser data, feed URLs, API keys, and unrelated screenshots.

## Scope

Relevant issues include cross-site scripting, unsafe feed/link handling, proxy URL validation bypass, dependency compromise, accidental sensitive-data disclosure, public-proxy privacy leakage, translation-provider data exposure, storage migration integrity, and static-export deployment integrity.

## Boundary

Fitimart is a local browser simulation. Virtual credit, purchases, receipts, backings, feed imports, and collections have no financial or contractual value. Public CORS proxy and translation providers are third parties with their own policies and no guaranteed availability.
