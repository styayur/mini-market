from playwright.sync_api import sync_playwright, expect
import json, re, os
base=os.environ.get('BASE_URL','http://localhost:3000').rstrip('/')
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,channel=os.environ.get('BROWSER_CHANNEL','msedge'));page=b.new_page(viewport={'width':1440,'height':1000})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/',wait_until='networkidle')
 page.get_by_role('button',name='将 OpenAI API 加入购物袋',exact=True).click()
 page.evaluate("() => { let s=JSON.parse(localStorage.getItem('mini-market-demo-v1')); s.credits=0; localStorage.setItem('mini-market-demo-v1',JSON.stringify(s)); }")
 page.goto(base+'/checkout/',wait_until='networkidle');page.reload(wait_until='networkidle')
 page.get_by_role('checkbox').check();expect(page.get_by_role('button',name='支付 480 Token',exact=True)).to_be_disabled()
 page.get_by_role('button',name='免费补充 10,000 体验 Token',exact=True).click()
 page.get_by_role('button',name='支付 480 Token',exact=True).evaluate('(el) => {el.click(); el.click();}')
 expect(page.locator('h1')).to_have_text('喜欢的，已经属于你。')
 s=page.evaluate("JSON.parse(localStorage.getItem('mini-market-demo-v1'))")
 assert s['credits']==9520 and len(s['orders'])==1
 page.goto(base+'/',wait_until='networkidle');page.get_by_role('button',name='将 Visual Studio Code 加入购物袋',exact=True).click()
 page.goto(base+'/cart/',wait_until='networkidle');page.get_by_role('button',name='移除',exact=True).click();expect(page.locator('h2')).to_have_text('这里，还有无限可能。')
 page.goto(base+'/',wait_until='networkidle');page.get_by_role('button',name='将 Visual Studio Code 加入购物袋',exact=True).click()
 page.evaluate("() => {let s=JSON.parse(localStorage.getItem('mini-market-demo-v1')); s.credits=0; localStorage.setItem('mini-market-demo-v1',JSON.stringify(s));}")
 page.goto(base+'/checkout/',wait_until='networkidle');page.reload(wait_until='networkidle');page.get_by_role('checkbox').check();page.get_by_role('button',name='支付 0 Token',exact=True).click();expect(page.locator('h1')).to_have_text('喜欢的，已经属于你。')
 page.goto(base+'/marketplace/',wait_until='networkidle');page.get_by_role('textbox',name='搜索商店').fill('no-such-capability-xyz');expect(page.get_by_text('暂时没有匹配的能力。',exact=True)).to_be_visible()
 page.get_by_role('textbox',name='搜索商店').fill('OpenAI');expect(page.locator('.shop-product h3')).to_have_text('OpenAI API')
 page.goto(base+'/concepts/new/',wait_until='networkidle');page.get_by_role('button',name='Generate concept',exact=True).click();page.get_by_role('button',name='06 Preview',exact=True).click();page.get_by_role('button',name='Publish concept',exact=True).click();page.get_by_role('link',name='View concept',exact=True).click();page.wait_for_load_state('networkidle');expect(page).to_have_url(re.compile(r'/concepts/view/\?slug='))
 expect(page.locator('h1')).to_be_visible();name=page.locator('h1').inner_text();page.reload(wait_until='networkidle');expect(page.locator('h1')).to_have_text(name)
 page.goto(base+'/future/',wait_until='networkidle');page.get_by_role('button',name='我的概念',exact=True).click();expect(page.locator('.product-card')).to_have_count(1);page.locator('.product-card h3 a').click();page.wait_for_load_state('networkidle');expect(page.locator('h1')).to_have_text(name)
 assert not errors,errors
 print('PASS production edge cases: insufficient balance, recovery top-up, rapid double payment, remove item, zero-cost checkout at zero balance, search empty/result states, create concept, static query detail and reload')
 b.close()
