"""Accept the Fitimart static build offline: hydration, purchase, migration, and responsive routes."""
import functools
import http.server
import json
from pathlib import Path
import re
import threading
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ATOMIC = 1_000_000


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def make_context(browser, locale="en-US", viewport=None):
    context = browser.new_context(viewport=viewport or {"width": 1440, "height": 1000}, locale=locale, accept_downloads=True)
    remote = []

    def route_request(route):
        hostname = urlparse(route.request.url).hostname
        if hostname in ("127.0.0.1", "localhost", None):
            route.continue_()
        else:
            remote.append(route.request.url)
            route.abort()

    context.route("**/*", route_request)
    return context, remote


def main():
    output = ROOT / "work/dependency-browser"
    output.mkdir(parents=True, exist_ok=True)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(ROOT / "out")))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{server.server_port}"
    report = {"ok": False, "checks": [], "remote_requests": [], "page_errors": []}
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)

            # Fresh profile: browser language, exact purchase, celebration, receipt, and duplicate click protection.
            context, remote = make_context(browser, locale="en-US")
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            response = page.goto(origin + "/", wait_until="networkidle")
            assert response.status == 200
            expect(page.get_by_role("heading", level=1)).to_contain_text("Great ideas")
            expect(page.locator(".wallet-button")).to_contain_text("1,000,000,000,000.00 USD")
            page.get_by_role("button", name="Add OpenAI API to bag", exact=True).click()
            page.goto(origin + "/checkout/", wait_until="networkidle")
            expect(page.get_by_role("button", name=re.compile(r"^Pay"))).to_be_disabled()
            page.get_by_role("checkbox").check()
            pay = page.get_by_role("button", name=re.compile(r"^Pay"))
            expect(pay).to_be_enabled()
            pay.click()
            expect(page.locator(".purchase-success")).to_be_visible()
            expect(page.locator(".coin-burst")).to_have_count(7)
            animation_name = page.locator(".coin-burst").first.evaluate("el => getComputedStyle(el).animationName")
            assert animation_name == "coin-bounce", animation_name
            page.wait_for_function("JSON.parse(localStorage.getItem('fitimart-marketplace-v2')).orders.length === 1")
            state = page.evaluate("JSON.parse(localStorage.getItem('fitimart-marketplace-v2'))")
            assert state["schemaVersion"] == 2
            assert state["wallet"]["balanceAtomic"] == str(10**18 - 480 * ATOMIC)
            order = state["orders"][0]
            assert order["totalAtomic"] == str(480 * ATOMIC)
            assert order["balanceAfterAtomic"] == str(10**18 - 480 * ATOMIC)
            assert order["items"][0]["quantity"] == 1
            assert state["libraryProductIds"] == ["openai-api"]
            with page.expect_download() as download_info:
                page.get_by_role("button", name="Save receipt", exact=True).click()
            receipt_path = output / "fitimart-receipt.txt"
            download_info.value.save_as(str(receipt_path))
            receipt = receipt_path.read_text(encoding="utf-8")
            assert "FITIMART / SIMULATION RECEIPT" in receipt
            assert "OpenAI API" in receipt and "480.00 USD" in receipt
            page.screenshot(path=str(output / "purchase-celebration.png"), full_page=True)

            # Rapid repeated settlement must create only one order and one debit.
            page.goto(origin + "/", wait_until="networkidle")
            page.get_by_role("button", name="Add OpenAI API to bag", exact=True).click()
            page.goto(origin + "/checkout/", wait_until="networkidle")
            page.get_by_role("checkbox").check()
            page.get_by_role("button", name=re.compile(r"^Pay")).evaluate("(el) => { el.click(); el.click(); }")
            expect(page.locator(".purchase-success")).to_be_visible()
            page.wait_for_function("JSON.parse(localStorage.getItem('fitimart-marketplace-v2')).orders.length === 2")
            state2 = page.evaluate("JSON.parse(localStorage.getItem('fitimart-marketplace-v2'))")
            assert len(state2["orders"]) == 2
            assert state2["wallet"]["balanceAtomic"] == str(10**18 - 960 * ATOMIC)

            # Explicit language override persists; auto follows the browser locale on a fresh profile.
            page.select_option('select[aria-label="Language"]', "zh")
            page.goto(origin + "/", wait_until="networkidle")
            expect(page.get_by_role("heading", level=1)).to_contain_text("把灵感")
            page.reload(wait_until="networkidle")
            expect(page.get_by_role("heading", level=1)).to_contain_text("把灵感")
            stored_preference = page.evaluate("localStorage.getItem('fitimart-language')")
            assert stored_preference == "zh"

            # Initial-credit editing never overwrites the active wallet.
            balance_before = page.evaluate("JSON.parse(localStorage.getItem('fitimart-marketplace-v2')).wallet.balanceAtomic")
            page.goto(origin + "/settings/", wait_until="networkidle")
            page.locator('.settings-card input[inputmode="decimal"]').first.fill("500")
            page.get_by_role("button", name="保存经济设置", exact=True).click()
            page.wait_for_function("JSON.parse(localStorage.getItem('fitimart-marketplace-v2')).economy.initialCreditAtomic === '500000000'")
            state3 = page.evaluate("JSON.parse(localStorage.getItem('fitimart-marketplace-v2'))")
            assert state3["wallet"]["balanceAtomic"] == balance_before
            assert state3["economy"]["initialCreditAtomic"] == str(500 * ATOMIC)

            # Feed safety validation works without a network request.
            page.goto(origin + "/feeds/", wait_until="networkidle")
            page.locator(".feed-add-card input[type=url]").fill("http://localhost/private.xml")
            page.locator(".feed-add-card button[type=submit]").click()
            expect(page.locator(".settings-message")).to_contain_text("Localhost")
            assert not remote, remote
            assert not errors, errors
            report["checks"].append("fresh profile exact purchase, coin animation, receipt, duplicate-click guard")
            report["checks"].append("browser language detection, manual override persistence, safe initial-credit edit")
            report["checks"].append("feed URL safety validation without remote calls")
            context.close()

            # Legacy profile migration preserves recoverable user data.
            context2, remote2 = make_context(browser, locale="en-US")
            page2 = context2.new_page()
            errors2 = []
            page2.on("pageerror", lambda error: errors2.append(str(error)))
            page2.goto(origin + "/", wait_until="networkidle")
            legacy = {
                "credits": 12345,
                "cartProductIds": ["openai-api"],
                "cartQuantities": {"openai-api": 2},
                "favoriteProductIds": ["openai-api"],
                "watchedConceptIds": ["universal-memory-api"],
                "libraryProductIds": ["visual-studio-code"],
                "createdConcepts": [],
                "orders": [{
                    "id": "legacy-order", "createdAt": "2026-01-01T00:00:00Z", "total": 480,
                    "balanceAfter": 11865, "items": [{"productId": "openai-api", "name": "OpenAI API", "quantity": 1, "unitPrice": 480}],
                }],
                "topUps": [{"id": "legacy-topup", "amount": 1000, "createdAt": "2026-01-01T00:00:00Z"}],
                "transactions": [{"id": "legacy-tx", "userId": "demo-user", "productId": "openai-api", "quantity": 1, "creditsSpent": 480, "createdAt": "2026-01-01T00:00:00Z", "status": "COMPLETED"}],
                "backings": [{"id": "legacy-back", "conceptId": "universal-memory-api", "userId": "demo-user", "credits": 200, "createdAt": "2026-01-01T00:00:00Z"}],
                "conceptBackingTotals": {"universal-memory-api": 200},
            }
            page2.evaluate("value => { localStorage.setItem('mini-market-demo-v1', JSON.stringify(value)); localStorage.removeItem('fitimart-marketplace-v2'); }", legacy)
            page2.reload(wait_until="networkidle")
            page2.wait_for_function("localStorage.getItem('fitimart-marketplace-v2') !== null")
            migrated = page2.evaluate("JSON.parse(localStorage.getItem('fitimart-marketplace-v2'))")
            assert migrated["wallet"]["balanceAtomic"] == str(12345 * ATOMIC)
            assert migrated["favoriteProductIds"] == ["openai-api"]
            assert migrated["watchedConceptIds"] == ["universal-memory-api"]
            assert migrated["libraryProductIds"] == ["visual-studio-code"]
            assert migrated["orders"][0]["totalAtomic"] == str(480 * ATOMIC)
            assert migrated["topUps"][0]["amountAtomic"] == str(1000 * ATOMIC)
            assert migrated["transactions"][0]["amountAtomic"] == str(480 * ATOMIC)
            assert migrated["backings"][0]["amountAtomic"] == str(200 * ATOMIC)
            assert migrated["conceptBackingTotals"]["universal-memory-api"] == str(200 * ATOMIC)
            assert not remote2, remote2
            assert not errors2, errors2
            report["checks"].append("legacy Mini Market profile migrated without resetting balances or history")

            # Responsive route smoke test including the new feeds and settings pages.
            for width in (390, 768):
                page2.set_viewport_size({"width": width, "height": 844})
                for route in ("", "cart/", "checkout/", "dashboard/", "feeds/", "settings/", "library/", "marketplace/", "future/", "marketplace/view/?slug=missing"):
                    page2.goto(origin + "/" + route, wait_until="networkidle")
                    assert not page2.evaluate("document.documentElement.scrollWidth > window.innerWidth"), f"overflow {width} {route}"
            report["checks"].append("responsive route checks at 390px and 768px")
            page2.screenshot(path=str(output / "mobile-feeds.png"), full_page=True)
            context2.close()

            # Fresh browser locale should choose the supported interface language automatically.
            context3, remote3 = make_context(browser, locale="zh-CN")
            page3 = context3.new_page()
            page3.goto(origin + "/", wait_until="networkidle")
            expect(page3.get_by_role("heading", level=1)).to_contain_text("把灵感")
            assert page3.evaluate("localStorage.getItem('fitimart-language')") == "auto"
            assert not remote3
            report["checks"].append("fresh zh-CN browser profile selected Chinese automatically")
            context3.close()
            browser.close()

        report.update(ok=True, remote_requests=[], page_errors=[], limits=["Offline build acceptance uses synthetic state; live feeds are tested separately by tests/live-feeds.spec.py."])
        (output / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print("PASS:", "; ".join(report["checks"]))
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
