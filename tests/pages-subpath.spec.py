"""Verify the static export when mounted under the real GitHub Pages repository subpath."""
from __future__ import annotations

import functools
import http.server
import os
from pathlib import Path
import shutil
import sys
import tempfile
import threading
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE_PATH = os.environ.get("NEXT_PUBLIC_BASE_PATH", "/fitimart").strip("/")


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    assert (ROOT / "out" / "index.html").exists(), "Run a static build before this test."
    with tempfile.TemporaryDirectory(prefix="fitimart-pages-") as temp:
        target = Path(temp) / BASE_PATH
        shutil.copytree(ROOT / "out", target)
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=temp))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        origin = f"http://127.0.0.1:{server.server_port}"
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page(viewport={"width": 1440, "height": 1000}, locale="en-US")
                failures = []
                errors = []
                page.on("requestfailed", lambda request: failures.append(f"{request.url}: {request.failure}") if urlparse(request.url).hostname == "127.0.0.1" and request.resource_type in {"script", "stylesheet", "font", "image"} else None)
                page.on("pageerror", lambda error: errors.append(str(error)))
                response = page.goto(f"{origin}/{BASE_PATH}/", wait_until="networkidle")
                assert response and response.status == 200
                expect(page.get_by_role("heading", level=1)).to_contain_text("Great ideas")
                expect(page.locator("link[rel=stylesheet]")).to_have_count(1)
                stylesheet = page.locator("link[rel=stylesheet]").get_attribute("href")
                assert stylesheet and stylesheet.startswith(f"/{BASE_PATH}/_next/"), stylesheet
                for route in ("marketplace/", "feeds/", "settings/", "marketplace/view/?slug=missing"):
                    page.goto(f"{origin}/{BASE_PATH}/{route}", wait_until="networkidle")
                    assert page.locator("main").is_visible()
                    assert f"/{BASE_PATH}/" in page.url
                    assert not page.evaluate("document.documentElement.scrollWidth > window.innerWidth")
                assert not failures, failures
                assert not errors, errors
                sys.stdout.write(f"PASS Pages subpath /{BASE_PATH}/: assets, routes, query route, and responsive layout\n")
                browser.close()
        finally:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    main()
