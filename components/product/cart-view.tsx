"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { ProductIcon } from "@/components/product/product-icon";
import { formatMoney } from "@/lib/format";
import { addAtomic, compareAtomic, multiplyAtomic } from "@/lib/money";
import { quantityFor } from "@/lib/commerce";
import { productHref } from "@/lib/links";

export function CartView() {
  const { cartProductIds, cartQuantities, products, removeFromCart, setQuantity, balanceAtomic, economy, hydrated } = useMarketplace();
  const { language } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const items = products.filter((product) => cartProductIds.includes(product.id));
  const totalAtomic = items.reduce((total, product) => addAtomic(total, multiplyAtomic(product.priceAtomic, quantityFor(cartQuantities, product.id))), "0");
  if (!hydrated) return <div className="skeleton" style={{ height: 420 }} />;
  return (
    <>
      <div className="commerce-heading">
        <Link href="/marketplace"><ArrowLeft size={15} /> {c("Keep discovering", "继续逛逛")}</Link>
        <h1>{c("Your shopping bag.", "你的购物袋。")}<span>{items.length}</span></h1>
        <p>{c("Good choices. Let's make them yours.", "眼光不错，把喜欢的内容带回去吧。")}</p>
      </div>
      {!items.length ? (
        <div className="empty-state">
          <div>
            <ShoppingBag size={38} />
            <h2>{c("A little room for possibility.", "这里还有无限可能。")}</h2>
            <p>{c("Your bag is empty. Discover something that sparks a new idea.", "购物袋还是空的，去挑选让你心动的发现。")}</p>
            <Link className="button button-primary" href="/marketplace">{c("Explore the market", "逛逛市场")}</Link>
          </div>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            <section className="bag-items">
              {items.map((product) => {
                const quantity = quantityFor(cartQuantities, product.id);
                return (
                  <article className="bag-item" key={product.id}>
                    <div className="bag-product-art"><ProductIcon name={product.icon} size={28} /></div>
                    <div className="bag-product-copy">
                      <span>{product.provider} · {product.type}</span>
                      <h2><Link href={productHref(product)}>{product.name}</Link></h2>
                      <p>{product.origin.kind === "RSS" ? c("Subscribed content · simulated pass", "订阅内容 · 模拟通行证") : c("Digital capability pass · demo collection", "数字能力通行证 · 体验收藏")}</p>
                      <button className="remove-item" type="button" onClick={() => removeFromCart(product.id)}><Trash2 size={12} /> {c("Remove", "移除")}</button>
                    </div>
                    <div className="bag-price">
                      <strong>{formatMoney(multiplyAtomic(product.priceAtomic, quantity), economy, language)}</strong>
                      <small>{formatMoney(product.priceAtomic, economy, language)} / {c("pass", "张")}</small>
                      <div className="quantity-control">
                        <button type="button" disabled={quantity <= 1} onClick={() => setQuantity(product.id, quantity - 1)} aria-label={c(`Decrease ${product.name}`, `减少 ${product.name}`)}><Minus size={13} /></button>
                        <output aria-label={c(`${product.name} quantity`, `${product.name} 数量`)}>{quantity}</output>
                        <button type="button" disabled={quantity >= 99} onClick={() => setQuantity(product.id, quantity + 1)} aria-label={c(`Increase ${product.name}`, `增加 ${product.name}`)}><Plus size={13} /></button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
            <div className="bag-reassurance">
              <ShieldCheck size={18} />
              <p>{c("Every pass joins your local collection. No real provider access or financial right is included.", "每张通行证都会进入本地收藏库，不包含真实服务访问权或金融权益。")}</p>
            </div>
          </div>
          <aside className="card cart-summary">
            <h2>{c("Order summary", "订单明细")}</h2>
            <div className="order-line"><span>{c("Content passes", "内容通行证")}</span><span>{formatMoney(totalAtomic, economy, language)}</span></div>
            <div className="order-line"><span>{c("Delivery", "交付方式")}</span><span className="success-text">{c("Instant · local", "即时 · 本地")}</span></div>
            <div className="order-line"><span>{c("Service fee", "服务费")}</span><span>{formatMoney("0", economy, language)}</span></div>
            <div className="summary-total"><span>{c("Total", "合计")}</span><strong>{formatMoney(totalAtomic, economy, language)}</strong></div>
            <div className="balance-note"><span>{c("Wallet balance", "钱包余额")}</span><strong>{formatMoney(balanceAtomic, economy, language)}</strong></div>
            {compareAtomic(totalAtomic, balanceAtomic) > 0 && <p className="commerce-error">{c("Your virtual balance needs a boost.", "虚拟余额不足。")} <Link href="/dashboard">{c("Open wallet", "打开钱包")}</Link></p>}
            <Link className="button button-primary button-lg" href="/checkout">{c("Continue to checkout", "前往结算")} <ArrowRight size={16} /></Link>
            <p className="checkout-note">{c("Simulation only. No real money changes hands.", "仅为模拟，不发生真实资金交易。")}</p>
          </aside>
        </div>
      )}
    </>
  );
}
