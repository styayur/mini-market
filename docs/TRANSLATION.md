# Localization and machine translation

Fitimart separates interface localization from content translation.

## Interface localization

- Supported interface languages: English (`en`) and Simplified Chinese (`zh`, HTML locale `zh-CN`).
- Resolution order: explicit `?lang=` override, saved preference, browser `navigator.languages`/`navigator.language`, then English fallback.
- The language selector offers browser-language mode, English, and Simplified Chinese.
- The explicit choice is stored under `fitimart-language`; the old `mini-market-language` key is read and then retired.
- Dates, numbers, currency presentation, empty states, errors, and accessibility labels use the active interface locale where implemented.

## Content translation

Content translation is optional and independent of interface translation.

- Provider interface: `TranslationProvider` in `lib/translation/translation-service.ts`.
- Current provider: **MyMemory**.
- Endpoint: `https://api.mymemory.translated.net/get`
- Authentication: none for the anonymous endpoint.
- CORS: verified in Chromium on 2026-11-07.
- Free anonymous limit: **5,000 characters/day** per MyMemory's published usage limits.
- No email address or secret API key is embedded.
- Original content is always retained.
- Successful translations are cached in IndexedDB.
- A failure or unsupported pair shows the original text and a non-blocking error.
- Per-item controls allow switching back to the original.

Sources:

- API specification: <https://mymemory.translated.net/doc/spec.php>
- Usage limits: <https://mymemory.translated.net/doc/usagelimits.php>
- Terms and privacy: <https://mymemory.translated.net/terms-and-conditions>

## Privacy

Submitting an item description or title to MyMemory sends that text to a third-party service. Only use the optional translation control on public content. Do not translate confidential text.

## Coverage

MyMemory determines available language pairs and machine-translation quality. Fitimart does not claim literal support for every human language. The current UI exposes English and Simplified Chinese targets; source language metadata comes from the feed and may be missing or inaccurate.

## Live acceptance

On 2026-11-07, the browser acceptance run translated a live feed item in the Fitimart UI through MyMemory and rendered the translated label. This is a point-in-time result and not a quota or uptime guarantee.
