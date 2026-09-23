"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { ProductIcon } from "@/components/product/product-icon";
import { formatCredits } from "@/lib/format";
import { quantityFor } from "@/lib/commerce";
import type { MarketOrder } from "@/types/marketplace";

export function downloadReceipt(order: MarketOrder) {
  const text = [
    "MINI MARKET / DEMO RECEIPT",
    order.id,
    new Date(order.createdAt).toISOString(),
    "",
    ...order.items.map(
      (item) =>
        `${item.name} x ${item.quantity} @ ${item.unitPrice} = ${item.quantity * item.unitPrice} Token`,
    ),
    "",
    `Total: ${order.total} Token`,
    `Wallet after purchase: ${order.balanceAfter} Token`,
    "",
    "Demo collection only. No real payment, provider access, or asset ownership.",
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${order.id}.txt`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function CheckoutView() {
  const {
    cartProductIds,
    cartQuantities,
    products,
    credits,
    purchase,
    hydrated,
    topUp,
  } = useMarketplace();
  const { language } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const [order, setOrder] = useState<MarketOrder | null>(null);
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);
  const items = products.filter((p) => cartProductIds.includes(p.id));
  const total = items.reduce(
    (sum, p) => sum + p.demoPrice * quantityFor(cartQuantities, p.id),
    0,
  );
  if (!hydrated) return <div className="skeleton" style={{ height: 420 }} />;
  if (order)
    return (
      <section className="purchase-success">
        <div className="success-seal">
          <Check size={34} />
        </div>
        <span className="section-overline">
          {c("A very good choice", "一次不错的选择")}
        </span>
        <h1>{c("Consider it yours.", "喜欢的，已经属于你。")}</h1>
        <p>
          {c(
            "Your new capabilities have landed in your collection.",
            "新的能力通行证，已经放进你的收藏库。",
          )}
        </p>
        <div className="receipt">
          <div className="receipt-heading">
            <strong>mini market.</strong>
            <span>{c("Order complete", "订单已完成")}</span>
          </div>
          <div className="receipt-meta">
            <span>{order.id}</span>
            <span>
              {new Date(order.createdAt).toLocaleString(
                language === "zh" ? "zh-CN" : "en-US",
              )}
            </span>
          </div>
          {order.items.map((item) => (
            <div className="order-line" key={item.productId}>
              <span>
                {item.name} <small>× {item.quantity}</small>
              </span>
              <strong>◈ {formatCredits(item.unitPrice * item.quantity)}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>{c("Paid with demo Tokens", "已支付体验 Token")}</span>
            <strong>◈ {formatCredits(order.total)}</strong>
          </div>
          <div className="order-line">
            <span>{c("Remaining balance", "支付后余额")}</span>
            <span>{formatCredits(order.balanceAfter)} Token</span>
          </div>
          <div className="receipt-barcode" aria-hidden="true" />
          <button
            className="receipt-download"
            onClick={() => downloadReceipt(order)}
          >
            <Download size={14} />
            {c("Save receipt", "保存收据")}
          </button>
        </div>
        <div className="success-actions">
          <Link className="button button-primary button-lg" href="/library">
            {c("Open my collection", "查看我的收藏库")} <ArrowRight size={15} />
          </Link>
          <Link className="button button-lg" href="/">
            {c("Keep discovering", "继续逛逛")}
          </Link>
        </div>
      </section>
    );
  if (!items.length)
    return (
      <div className="empty-state">
        <div>
          <h1>
            {c("Your next order starts here.", "下一笔心动，从这里开始。")}
          </h1>
          <p>
            {c(
              "Add a capability to your bag before checking out.",
              "先把喜欢的能力放进购物袋，再来结算。",
            )}
          </p>
          <Link className="button button-primary" href="/marketplace">
            {c("Explore the market", "前往商店")}
          </Link>
          <Link className="button" href="/dashboard">
            {c("View past orders", "查看历史订单")}
          </Link>
        </div>
      </div>
    );
  const confirm = () => {
    const result = purchase();
    setMessage(result.message);
    if (result.ok && result.order) {
      setOrder(result.order);
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };
  return (
    <>
      <div className="commerce-heading">
        <Link href="/cart">
          <ArrowLeft size={15} />
          {c("Back to your bag", "返回购物袋")}
        </Link>
        <h1>{c("Make it yours.", "确认心动，即刻入手。")}</h1>
        <p>
          {c(
            "One last look before your next possibility arrives.",
            "再确认一下，你的下一种可能即将到来。",
          )}
        </p>
      </div>
      <ol className="checkout-steps">
        <li>
          <CheckCircle2 size={17} />
          {c("Shopping bag", "购物袋")}
        </li>
        <li aria-current="step">
          <span>2</span>
          {c("Review & pay", "确认并支付")}
        </li>
        <li>
          <span>3</span>
          {c("In your collection", "收入收藏库")}
        </li>
      </ol>
      <div className="cart-layout">
        <div>
          <section className="checkout-review card">
            <h2>{c("Your new capabilities", "即将拥有的能力")}</h2>
            {items.map((p) => (
              <div className="checkout-item" key={p.id}>
                <ProductIcon name={p.icon} />
                <div>
                  <strong>{p.name}</strong>
                  <small>
                    {p.provider} · × {quantityFor(cartQuantities, p.id)}
                  </small>
                </div>
                <strong>
                  ◈{" "}
                  {formatCredits(
                    p.demoPrice * quantityFor(cartQuantities, p.id),
                  )}
                </strong>
              </div>
            ))}
          </section>
          <section className="payment-method card">
            <div>
              <Wallet size={23} />
              <h2>{c("Mini Market wallet", "Mini Market 钱包")}</h2>
              <CheckCircle2 size={20} />
            </div>
            <p>
              {c("Available balance", "可用余额")}{" "}
              <strong>{formatCredits(credits)} Token</strong>
            </p>
            <span>
              {c(
                "Instant settlement with demo Tokens. No payment details needed.",
                "使用体验 Token 即刻结算，无需填写付款信息。",
              )}
            </span>
            {total > credits && (
              <div className="insufficient-balance">
                <p>
                  {c(
                    "Not enough Tokens for this order.",
                    "当前 Token 不足以支付这笔订单。",
                  )}
                </p>
                <button className="button" onClick={() => topUp(10000)}>
                  {c(
                    "Add 10,000 demo Tokens · free",
                    "免费补充 10,000 体验 Token",
                  )}
                </button>
              </div>
            )}
          </section>
        </div>
        <aside className="card cart-summary">
          <h2>{c("Ready when you are", "准备好了，就出发")}</h2>
          <div className="order-line">
            <span>{c("Subtotal", "商品小计")}</span>
            <span>◈ {formatCredits(total)}</span>
          </div>
          <div className="order-line">
            <span>{c("Fees", "服务费")}</span>
            <span>0 Token</span>
          </div>
          <div className="summary-total">
            <span>{c("You pay", "本次支付")}</span>
            <strong>◈ {formatCredits(total)}</strong>
          </div>
          <div className="order-line">
            <span>{c("Balance after payment", "支付后余额")}</span>
            <span>
              {total <= credits ? formatCredits(credits - total) : "—"} Token
            </span>
          </div>
          <label className="checkout-consent">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>
              {c(
                "I'm collecting demo passes. This does not activate real provider services.",
                "我了解购买的是体验通行证，不会开通提供商的真实服务。",
              )}
            </span>
          </label>
          {message && (
            <p role="alert" className="commerce-error">
              {message}
            </p>
          )}
          <button
            className="button button-primary button-lg"
            disabled={!accepted || total > credits}
            onClick={confirm}
          >
            {c("Pay", "支付")} {formatCredits(total)} Token{" "}
            <ArrowRight size={16} />
          </button>
          <p className="checkout-note">
            <ShieldCheck size={13} />
            {c("Demo checkout · no real payment", "体验结算 · 无真实扣款")}
          </p>
        </aside>
      </div>
    </>
  );
}
