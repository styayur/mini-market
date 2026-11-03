"""Accept the built demo with isolated browser storage and no provider requests."""
import functools
import http.server
import json
from pathlib import Path
import re
import threading
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    output = ROOT / 'work/dependency-browser'
    output.mkdir(parents=True, exist_ok=True)
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(ROOT / 'out')))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={'width': 1440, 'height': 1000}, locale='en-US', accept_downloads=True)
            remote = []
            def route_request(route):
                if urlparse(route.request.url).hostname in ('127.0.0.1', 'localhost', None):
                    route.continue_()
                else:
                    remote.append(route.request.url)
                    route.abort()
            context.route('**/*', route_request)
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            origin = f'http://127.0.0.1:{server.server_port}'
            response = page.goto(origin, wait_until='networkidle')
            assert response.status == 200
            toggle = page.locator('button.language-toggle')
            expect(toggle).to_have_text('EN')
            toggle.click()
            expect(page.get_by_role('heading', level=1)).to_contain_text('Great ideas')
            page.get_by_role('button', name='Models & tokens', exact=True).click()
            page.get_by_role('button', name='Add OpenAI API to bag', exact=True).click()
            expect(page.get_by_role('button', name='OpenAI API in bag', exact=True)).to_be_disabled()
            page.goto(origin + '/checkout/', wait_until='networkidle')
            pay = page.get_by_role('button', name=re.compile(r'^Pay 480 Token'))
            expect(pay).to_be_disabled()
            page.get_by_role('checkbox').check()
            expect(pay).to_be_enabled()
            pay.click()
            expect(page.locator('.purchase-success')).to_contain_text('Order complete')
            page.wait_for_function("JSON.parse(localStorage.getItem('mini-market-demo-v1')).orders.length === 1")
            state = page.evaluate("JSON.parse(localStorage.getItem('mini-market-demo-v1'))")
            assert state['credits'] == 9520
            assert state['cartProductIds'] == []
            assert state['libraryProductIds'] == ['openai-api']
            order = state['orders'][0]
            assert order['total'] == 480 and order['balanceAfter'] == 9520
            assert len(order['items']) == 1 and order['items'][0]['quantity'] == 1
            with page.expect_download() as download_info:
                page.get_by_role('button', name='Save receipt', exact=True).click()
            download = download_info.value
            receipt_path = output / 'synthetic-receipt.txt'
            download.save_as(str(receipt_path))
            receipt = receipt_path.read_text(encoding='utf-8')
            assert order['id'] in receipt and 'OpenAI API' in receipt and '480' in receipt
            page.screenshot(path=str(output / 'checkout.png'), full_page=True)
            page.get_by_role('link', name='Open my collection', exact=True).click()
            expect(page.locator('main')).to_contain_text('OpenAI API')
            page.reload(wait_until='networkidle')
            expect(page.locator('main')).to_contain_text('OpenAI API')
            stored = page.evaluate("JSON.parse(localStorage.getItem('mini-market-demo-v1'))")
            assert stored['orders'] == state['orders'] and stored['credits'] == 9520
            assert not remote, remote
            assert not errors, errors
            (output / 'report.json').write_text(json.dumps(dict(ok=True, checks=['built hydration and language/category interaction', 'demo bag and consent-gated checkout', 'exact debit and receipt download', 'collection and reload persistence'], remote_requests=remote, page_errors=errors, limits=['Disposable browser demo storage only; no real payment/provider service or user data.']), indent=2) + '\n', encoding='utf-8')
            context.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()
