from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import json, os
BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000").rstrip("/")
Path(".qa").mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,channel=os.environ.get('BROWSER_CHANNEL','msedge'))
    context=browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True)
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda err:errors.append(str(err)))
    page.goto(BASE_URL+'/',wait_until='networkidle')
    expect(page.locator('h1')).to_contain_text('把灵感')
    page.get_by_role('button',name='将 OpenAI API 加入购物袋',exact=True).click()
    page.get_by_role('link',name='购物袋，1 件商品',exact=True).click()
    page.wait_for_load_state('networkidle')
    page.get_by_role('button',name='增加 OpenAI API',exact=True).click()
    expect(page.get_by_role('status',name='OpenAI API 数量')).to_have_text('2')
    page.screenshot(path='.qa/bag-desktop.png',full_page=True)
    page.get_by_role('link',name='前往结算',exact=True).click()
    page.wait_for_load_state('networkidle')
    pay=page.get_by_role('button',name='支付 960 Token',exact=True)
    expect(pay).to_be_disabled()
    page.get_by_role('checkbox').check()
    pay.click()
    expect(page.locator('h1')).to_have_text('喜欢的，已经属于你。')
    state=page.evaluate("JSON.parse(localStorage.getItem('mini-market-demo-v1'))")
    assert state['credits']==9040 and len(state['orders'])==1
    assert state['transactions'][0]['quantity']==2
    with page.expect_download() as d:
        page.get_by_role('button',name='保存收据',exact=True).click()
    d.value.save_as('.qa/receipt.txt')
    assert 'Total: 960 Token' in Path('.qa/receipt.txt').read_text(encoding='utf-8')
    page.screenshot(path='.qa/receipt-desktop.png',full_page=True)
    page.get_by_role('link',name='查看我的收藏库',exact=True).click()
    page.wait_for_load_state('networkidle')
    expect(page.locator('.pass-ownership strong')).to_have_text('× 2')
    page.reload(wait_until='networkidle')
    expect(page.locator('.pass-ownership strong')).to_have_text('× 2')
    page.goto(BASE_URL+'/dashboard/',wait_until='networkidle')
    page.get_by_role('button',name='补充 1,000 Token',exact=True).click()
    expect(page.locator('.wallet-value')).to_contain_text('10,040')
    page.locator('.order-record summary').click()
    expect(page.locator('.order-record-detail')).to_contain_text('OpenAI API × 2')
    page.screenshot(path='.qa/wallet-desktop.png',full_page=True)
    page.goto(BASE_URL+'/concepts/universal-memory-api/',wait_until='networkidle')
    page.get_by_role('button',name='为这个未来投一票',exact=True).click()
    expect(page.get_by_role('dialog')).to_be_visible()
    page.get_by_role('button',name='确认支持',exact=True).click()
    expect(page.locator('.backing-success')).to_contain_text('200')
    state=page.evaluate("JSON.parse(localStorage.getItem('mini-market-demo-v1'))")
    assert state['credits']==9840 and len(state['backings'])==1
    page.get_by_role('button',name='为这个未来投一票',exact=True).click()
    page.keyboard.press('Escape')
    expect(page.get_by_role('dialog')).not_to_be_visible()
    page.goto(BASE_URL+'/',wait_until='networkidle')
    page.get_by_role('button',name='整套加入购物袋',exact=True).click()
    state=page.evaluate("JSON.parse(localStorage.getItem('mini-market-demo-v1'))")
    assert len(state['cartProductIds'])==3
    page.get_by_role('button',name='语言',exact=True).click()
    expect(page.locator('h1')).to_contain_text('Great ideas')
    page.reload(wait_until='networkidle')
    expect(page.locator('h1')).to_contain_text('Great ideas')
    page.screenshot(path='.qa/home-en.png',full_page=True)
    page.get_by_role('button',name='Language',exact=True).click()
    page.screenshot(path='.qa/home-desktop.png',full_page=True)
    for width in [390,768]:
        page.set_viewport_size({'width':width,'height':844})
        for route in ['', 'cart/', 'checkout/', 'dashboard/', 'library/', 'future/', 'marketplace/', 'marketplace/openai-api/', 'concepts/universal-memory-api/']:
            page.goto(BASE_URL+'/'+route,wait_until='networkidle')
            overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
            assert not overflow, f'Overflow: {width} {route}'
            if width==390 and route in ['', 'cart/', 'checkout/', 'future/']:
                page.screenshot(path='.qa/mobile-'+(route.replace('/','-') or 'home')+'.png',full_page=True)
    assert not errors, errors
    print('PASS: quantity, debit, receipt download, library persistence, top-up, history, backing, modal Escape, bundle, bilingual persistence, 18 responsive route checks; no page errors')
    browser.close()
