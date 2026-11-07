"""Live-service acceptance for public RSS, Atom, JSON Feed, public CORS proxies, and translation."""
from __future__ import annotations

import functools
import http.server
import json
import os
from pathlib import Path
import sys
import threading

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "work" / "live-feeds"
OUT.mkdir(parents=True, exist_ok=True)

FEEDS = [
    ("https://hnrss.org/frontpage", "Hacker News RSS"),
    ("https://github.blog/feed/", "GitHub Blog RSS"),
    ("https://daringfireball.net/feeds/json", "Daring Fireball JSON Feed"),
    ("https://github.com/atom/atom/releases.atom", "Atom Releases Feed"),
]


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    base = os.environ.get("BASE_URL", "").rstrip("/")
    server = None
    if not base:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(ROOT / "out")))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{server.server_port}"
    report = {"ok": False, "baseUrl": base, "feeds": [], "proxies": [], "translation": None}
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1440, "height": 1100}, locale="en-US")
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(base + "/feeds/", wait_until="networkidle")

            for index, (feed_url, expected_title) in enumerate(FEEDS, start=1):
                page.locator(".feed-add-card input[type=url]").fill(feed_url)
                page.locator(".feed-add-card input:not([type=url]):not([type=number])").first.fill(expected_title)
                page.locator(".feed-add-card button[type=submit]").click()
                expect(page.locator(".feed-subscription-card")).to_have_count(index, timeout=60_000)
                card = page.locator(".feed-subscription-card").nth(index - 1)
                expect(card.locator('.badge[data-status="READY"]')).to_be_visible(timeout=60_000)
                expect(card.locator(".feed-item-row")).not_to_have_count(0)
                title = card.locator(".feed-title-row h3").inner_text()
                report["feeds"].append({"url": feed_url, "title": title, "itemRows": card.locator(".feed-item-row").count()})
                assert title.strip(), feed_url
                assert card.locator(".feed-item-row").count() > 0, feed_url

            # Exercise both configured public proxy adapters from the browser origin.
            proxy_results = page.evaluate("""
                async () => {
                  const target = 'https://hnrss.org/frontpage';
                  const urls = [
                    ['cors-dev', 'https://proxy.cors.dev/' + target],
                    ['cors-tools', 'https://cors.tools/' + target],
                  ];
                  const results = [];
                  for (const [id, url] of urls) {
                    const response = await fetch(url);
                    const body = await response.text();
                    results.push({ id, status: response.status, contentType: response.headers.get('content-type'), ok: response.ok && body.includes('<rss') });
                  }
                  return results;
                }
            """)
            report["proxies"] = proxy_results
            for result in proxy_results:
                assert result["ok"], result
                page.wait_for_timeout(800)

            page.goto(base + "/marketplace/?source=RSS", wait_until="networkidle")
            expect(page.locator(".shop-product").first).to_be_visible()
            report["marketplaceRssProducts"] = page.locator(".shop-product").count()
            assert report["marketplaceRssProducts"] > 0
            first_card = page.locator(".shop-product").first
            first_name = first_card.locator("h3").inner_text().strip()
            first_card.locator(".quick-add").click()
            page.goto(base + "/cart/", wait_until="networkidle")
            expect(page.locator(".bag-item").first).to_contain_text(first_name)
            report["rssProductAddedToBag"] = first_name
            page.goto(base + "/feeds/", wait_until="networkidle")
            # MyMemory is free and keyless. Verify one real translation, then the UI fallback behavior.
            page.select_option('select[aria-label="Language"]', "zh")
            expect(page.get_by_role("heading", level=1)).to_contain_text("把开放网络")
            toggle = page.locator(".translation-toggle").first
            expect(toggle).to_be_visible(timeout=15_000)
            toggle.click()
            translation_error = page.locator(".translation-error")
            translated_label = page.locator(".translation-label").first
            try:
                expect(translated_label).to_be_visible(timeout=25_000)
                report["translation"] = {"ok": True, "provider": "MyMemory", "ui": "translated text displayed"}
            except Exception:
                error_text = translation_error.first.inner_text() if translation_error.count() else "no translation label or error"
                report["translation"] = {"ok": False, "provider": "MyMemory", "error": error_text}
                raise AssertionError(f"Live MyMemory translation failed: {error_text}")

            page.screenshot(path=str(OUT / "live-feeds.png"), full_page=True)
            assert not errors, errors
            report["pageErrors"] = errors
            report["ok"] = True
            report["limits"] = [
                "Public proxies and MyMemory are third-party best-effort services; availability and quotas are not guaranteed.",
                "Browser acceptance was performed only for the listed feeds at this run time.",
            ]
            (OUT / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
            sys.stdout.write("PASS live feeds: " + json.dumps(report, ensure_ascii=False) + "\n")
            context.close()
            browser.close()
    finally:
        if server:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    main()
