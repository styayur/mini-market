# Public CORS proxy providers

Fitimart fetches feeds from the browser. Direct requests are attempted first. When the publisher blocks browser access through CORS or the network, only enabled public proxy adapters are tried. The last fallback is a previously cached valid response.

No proxy uptime, quota, privacy behavior, or continued availability is guaranteed. Provider details below were checked on **2026-11-07**.

## Request order

1. **Direct** — always attempted first with `credentials: omit`, no referer, and a public HTTP(S) URL.
2. **cors.dev** — enabled by default after a successful live probe.
3. **cors.tools** — available as an alternative but disabled by default because its data notice says it records every request and response.
4. **Custom HTTPS template** — optional user configuration containing `{url}`; not verified by Fitimart.
5. **Cached response** — validated before use and shown with a stale/cache indicator.

Requests have a 20-second Fitimart timeout and a 6 MiB response cap. HTTP 404 and 429 are treated as definitive live failures; 5xx, network/CORS failures, malformed proxy responses, and invalid proxy content can proceed to the next adapter. Cached content is considered after live adapters fail.

## cors.dev

- Endpoint pattern: `https://proxy.cors.dev/<absolute-url>`
- Documentation: <https://cors.dev/>
- Privacy: <https://cors.dev/privacy>
- Live probe: HTTP 200, `application/xml; charset=utf-8`, CORS allowed
- Published free tier: 600 requests/minute/IP, 6 MiB response cap, 30-second upstream deadline, GET/HEAD, no API key
- Privacy summary: processes the destination URL and query string; published privacy text says raw destination URLs, query strings, keys, tokens, and response bodies are not recorded in application logs. Cloudflare processes network metadata.
- Default status: **enabled**

## cors.tools

- Endpoint pattern: `https://cors.tools/<absolute-url>`
- Documentation: <https://cors.tools/>
- Live probe: HTTP 200, `application/xml; charset=utf-8`, `Access-Control-Allow-Origin: *`
- Published bounds: up to 10 MiB proxied response, five redirects, 20-second fetch deadline, no API key
- Privacy summary: the public data notice states that all activity is recorded and kept, including URLs, submitted data, responses, IP address, approximate location, and network/browser fingerprints.
- Default status: **disabled; explicit opt-in only**

## Checked but not integrated

The following probes failed or required credentials on 2026-11-07, so they are not enabled defaults:

- `api.allorigins.win`: 522/408 during probes.
- `api.codetabs.com`: 522 during probes.
- `corsproxy.io`: reported that a valid API key is required.
- CORS Anywhere public demo: requires manual temporary opt-in and is rate limited.

## Custom proxy

A user can configure an HTTPS template such as:

```text
https://proxy.example/fetch?url={url}
```

`{url}` is replaced with `encodeURIComponent(targetUrl)`. The configuration is saved locally and identified as unverified. A custom proxy still receives public feed URLs and responses.

## Privacy checklist

- Subscribe only to public content.
- Never include credentials or private tokens in a feed URL.
- Do not use a proxy for private RSS/Atom/JSON documents.
- Review provider terms before enabling an adapter.
- Disable adapters you do not trust.
- Clear feed caches from the subscription manager when desired.
