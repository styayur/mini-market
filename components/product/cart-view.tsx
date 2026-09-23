"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { ProductIcon } from "@/components/product/product-icon";
import { formatCredits } from "@/lib/format";
import { quantityFor } from "@/lib/commerce";

export function CartView() {
  const {
    cartProductIds,
    cartQuantities,
    products,
    removeFromCart,
    setQuantity,
    credits,
    hydrated,
  } = useMarketplace();
  const { language } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const items = products.filter((p) => cartProductIds.includes(p.id));
  const total = items.reduce(
    (sum, p) => sum + p.demoPrice * quantityFor(cartQuantities, p.id),
    0,
  );
  if (!hydrated) return <div className="skeleton" style={{ height: 420 }} />;
  return (
    <>
      <div className="commerce-heading">
        <Link href="/marketplace">
          <ArrowLeft size={15} />
          {c("Keep discovering", "继续逛逛")}
        </Link>
        <h1>
          {c("Your shopping bag.", "你的购物袋。")}
          <span>{items.length}</span>
        </h1>
        <p>
          {c(
            "Good choices. Let's make them yours.",
            "眼光不错，把喜欢的能力带回去吧。",
          )}
        </p>
      </div>
      {!items.length ? (
        <div className="empty-state">
          <div>
            <ShoppingBag size={38} />
            <h2>
              {c("A little room for possibility.", "这里，还有无限可能。")}
            </h2>
            <p>
              {c(
                "Your bag is empty. Discover a capability that sparks something.",
                "购物袋还是空的，去挑选一项让你心动的能力。",
              )}
            </p>
            <Link className="button button-primary" href="/marketplace">
              {c("Explore the market", "逛逛能力商店")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            <section className="bag-items">
              {items.map((p) => {
                const qty = quantityFor(cartQuantities, p.id);
                return (
                  <article className="bag-item" key={p.id}>
                    <div className="bag-product-art">
                      <ProductIcon name={p.icon} size={28} />
                    </div>
                    <div className="bag-product-copy">
                      <span>
                        {p.provider} · {p.type}
                      </span>
                      <h2>
                        <Link href={`/marketplace/${p.slug}`}>{p.name}</Link>
                      </h2>
                      <p>
                        {c(
                          "Digital capability pass · demo collection",
                          "数字能力通行证 · 体验收藏",
                        )}
                      </p>
                      <button
                        className="remove-item"
                        type="button"
                        onClick={() => removeFromCart(p.id)}
                      >
                        <Trash2 size={12} />
                        {c("Remove", "移除")}
                      </button>
                    </div>
                    <div className="bag-price">
                      <strong>◈ {formatCredits(p.demoPrice * qty)}</strong>
                      <small>
                        {formatCredits(p.demoPrice)} Token / {c("pass", "张")}
                      </small>
                      <div className="quantity-control">
                        <button
                          type="button"
                          disabled={qty <= 1}
                          onClick={() => setQuantity(p.id, qty - 1)}
                          aria-label={c(`Decrease ${p.name}`, `减少 ${p.name}`)}
                        >
                          <Minus size={13} />
                        </button>
                        <output
                          aria-label={c(`${p.name} quantity`, `${p.name} 数量`)}
                        >
                          {qty}
                        </output>
                        <button
                          type="button"
                          disabled={qty >= 99}
                          onClick={() => setQuantity(p.id, qty + 1)}
                          aria-label={c(`Increase ${p.name}`, `增加 ${p.name}`)}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
            <div className="bag-reassurance">
              <ShieldCheck size={18} />
              <p>
                {c(
                  "Every pass joins your personal collection. Actual provider access is purchased separately.",
                  "每张通行证都会进入你的个人收藏库。真实服务需另外向提供商购买。",
                )}
              </p>
            </div>
          </div>
          <aside className="card cart-summary">
            <h2>{c("Order summary", "订单明细")}</h2>
            <div className="order-line">
              <span>{c("Capability passes", "能力通行证")}</span>
              <span>◈ {formatCredits(total)}</span>
            </div>
            <div className="order-line">
              <span>{c("Delivery", "交付方式")}</span>
              <span className="success-text">
                {c("Instant · free", "即时入库 · 免费")}
              </span>
            </div>
            <div className="order-line">
              <span>{c("Service fee", "服务费")}</span>
              <span>0 Token</span>
            </div>
            <div className="summary-total">
              <span>{c("Total", "合计")}</span>
              <strong>
                ◈ {formatCredits(total)}
                <small> Token</small>
              </strong>
            </div>
            <div className="balance-note">
              <span>{c("Wallet balance", "钱包余额")}</span>
              <strong>{formatCredits(credits)} Token</strong>
            </div>
            {total > credits && (
              <p className="commerce-error">
                {c(
                  "Your balance needs a little boost. Add demo Tokens in your wallet.",
                  "余额不足，可以在钱包免费补充体验 Token。",
                )}{" "}
                <Link href="/dashboard">{c("Open wallet", "打开钱包")}</Link>
              </p>
            )}
            <Link className="button button-primary button-lg" href="/checkout">
              {c("Continue to checkout", "前往结算")} <ArrowRight size={16} />
            </Link>
            <p className="checkout-note">
              {c(
                "Demo Tokens only. No real money changes hands.",
                "仅使用体验 Token，不发生真实资金交易。",
              )}
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
