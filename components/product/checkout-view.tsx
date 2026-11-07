"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Download, ShieldCheck, Wallet } from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { ProductIcon } from "@/components/product/product-icon";
import { formatDateTime, formatMoney } from "@/lib/format";
import { addAtomic, compareAtomic, multiplyAtomic, subtractAtomic } from "@/lib/money";
import { quantityFor } from "@/lib/commerce";
import type { MarketOrder } from "@/types/marketplace";

export function downloadReceipt(order: MarketOrder, language: "en" | "zh" = "en") {
  const economy = {
    currencyCode: order.currencyCode,
    currencyLabel: order.currencyLabel,
    displayPrecision: order.displayPrecision,
    displayPattern: "{amount} {currency}",
  };
  const text = [
    language === "zh" ? "FITIMART / 模拟收据" : "FITIMART / SIMULATION RECEIPT",
    order.id,
    formatDateTime(order.createdAt, language),
    "",
    ...order.items.map((item) => {
      const lineTotal = multiplyAtomic(item.unitPriceAtomic, item.quantity);
      return `${item.name} x ${item.quantity} @ ${formatMoney(item.unitPriceAtomic, economy as never, language)} = ${formatMoney(lineTotal, economy as never, language)}`;
    }),
    "",
    `${language === "zh" ? "合计" : "Total"}: ${formatMoney(order.totalAtomic, economy as never, language)}`,
    `${language === "zh" ? "购买后余额" : "Wallet after purchase"}: ${formatMoney(order.balanceAfterAtomic, economy as never, language)}`,
    "",
    language === "zh" ? "仅为模拟。不涉及真实付款、服务访问权或资产所有权。" : "Simulation only. No real payment, provider access, or asset ownership.",
  ].join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${order.id}.txt`;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function AnimatedBalance({ from, to, order, language }: { from: string; to: string; order: MarketOrder; language: "en" | "zh" }) {
  const [value, setValue] = useState(from);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const reducedFrame = requestAnimationFrame(() => setValue(to));
      return () => cancelAnimationFrame(reducedFrame);
    }
    const start = performance.now();
    const duration = 900;
    const startAmount = BigInt(from);
    const endAmount = BigInt(to);
    const difference = endAmount - startAmount;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const scaled = BigInt(Math.round(eased * 1000));
      setValue((startAmount + (difference * scaled) / 1000n).toString());
      if (progress < 1) frame = requestAnimationFrame(tick);
      else setValue(to);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [from, to]);
  return <span className="balance-animated" aria-label={`${language === "zh" ? "动画显示新余额" : "Animated new balance"}: ${formatMoney(to, { currencyCode: order.currencyCode, currencyLabel: order.currencyLabel, displayPrecision: order.displayPrecision, displayPattern: order.displayPattern } as never, language)}`}>{formatMoney(value, { currencyCode: order.currencyCode, currencyLabel: order.currencyLabel, displayPrecision: order.displayPrecision, displayPattern: order.displayPattern } as never, language)}</span>;
}

function PurchaseCelebration() {
  return (
    <div className="purchase-celebration" aria-hidden="true">
      {Array.from({ length: 7 }, (_, index) => <span className={`coin-burst coin-burst-${index + 1}`} key={index}>◈</span>)}
    </div>
  );
}

export function CheckoutView() {
  const { cartProductIds, cartQuantities, products, balanceAtomic, economy, purchase, hydrated, topUp } = useMarketplace();
  const { language, t } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const [order, setOrder] = useState<MarketOrder | null>(null);
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const items = products.filter((product) => cartProductIds.includes(product.id));
  const totalAtomic = items.reduce((total, product) => addAtomic(total, multiplyAtomic(product.priceAtomic, quantityFor(cartQuantities, product.id))), "0");
  if (!hydrated) return <div className="skeleton" style={{ height: 420 }} />;
  if (order) {
    const before = addAtomic(order.balanceAfterAtomic, order.totalAtomic);
    const receiptEconomy = { currencyCode: order.currencyCode, currencyLabel: order.currencyLabel, displayPrecision: order.displayPrecision, displayPattern: order.displayPattern };
    return (
      <section className="purchase-success">
        <PurchaseCelebration />
        <div className="success-seal"><Check size={34} /></div>
        <span className="section-overline">{c("Simulated purchase complete", "模拟购买已完成")}</span>
        <h1>{t("checkout.successTitle")}</h1>
        <p>{t("checkout.successBody")}</p>
        <div className="purchase-balance-update" role="status" aria-live="polite">
          <small>{t("checkout.remaining")}</small>
          <strong><AnimatedBalance from={before} to={order.balanceAfterAtomic} order={order} language={language} /></strong>
        </div>
        <div className="receipt">
          <div className="receipt-heading"><strong>fitimart.</strong><span>{t("checkout.receipt")}</span></div>
          <div className="receipt-meta"><span>{order.id}</span><span>{formatDateTime(order.createdAt, language)}</span></div>
          {order.items.map((item) => (
            <div className="order-line" key={item.productId}>
              <span>{item.name} <small>× {item.quantity}</small></span>
              <strong>{formatMoney(multiplyAtomic(item.unitPriceAtomic, item.quantity), receiptEconomy as never, language)}</strong>
            </div>
          ))}
          <div className="summary-total"><span>{t("checkout.paid")}</span><strong>{formatMoney(order.totalAtomic, receiptEconomy as never, language)}</strong></div>
          <div className="order-line"><span>{t("checkout.remaining")}</span><span>{formatMoney(order.balanceAfterAtomic, receiptEconomy as never, language)}</span></div>
          <p className="receipt-warning">{t("checkout.simulatedReceipt")}</p>
          <div className="receipt-barcode" aria-hidden="true" />
          <button className="receipt-download" onClick={() => downloadReceipt(order, language)}><Download size={14} /> {t("checkout.download")}</button>
        </div>
        <div className="success-actions">
          <Link className="button button-primary button-lg" href="/library">{c("Open my collection", "查看我的收藏库")} <ArrowRight size={15} /></Link>
          <Link className="button button-lg" href="/">{c("Keep discovering", "继续逛逛")}</Link>
        </div>
      </section>
    );
  }
  if (!items.length) {
    return (
      <div className="empty-state">
        <div>
          <h1>{c("Your next order starts here.", "下一笔心动，从这里开始。")}</h1>
          <p>{c("Add an item to your bag before checking out.", "先把喜欢的内容放进购物袋，再来结算。")}</p>
          <Link className="button button-primary" href="/marketplace">{c("Explore the market", "前往市场")}</Link>
          <Link className="button" href="/dashboard">{c("View past orders", "查看历史订单")}</Link>
        </div>
      </div>
    );
  }
  const confirm = () => {
    if (confirming) return;
    setConfirming(true);
    const result = purchase();
    setMessage(result.message);
    if (result.ok && result.order) {
      setOrder(result.order);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setConfirming(false);
  };
  return (
    <>
      <div className="commerce-heading">
        <Link href="/cart"><ArrowLeft size={15} /> {c("Back to your bag", "返回购物袋")}</Link>
        <h1>{c("Make it yours.", "确认心动，即刻入手。")}</h1>
        <p>{c("One last look before your simulated purchase is recorded.", "最后确认一次，然后记录这笔模拟购买。")}</p>
      </div>
      <ol className="checkout-steps">
        <li><CheckCircle2 size={17} /> {c("Shopping bag", "购物袋")}</li>
        <li aria-current="step"><span>2</span> {c("Review & pay", "确认并支付")}</li>
        <li><span>3</span> {c("In your collection", "收入收藏库")}</li>
      </ol>
      <div className="cart-layout">
        <div>
          <section className="checkout-review card">
            <h2>{c("Your new items", "即将拥有的内容")}</h2>
            {items.map((product) => (
              <div className="checkout-item" key={product.id}>
                <ProductIcon name={product.icon} />
                <div><strong>{product.name}</strong><small>{product.provider} · × {quantityFor(cartQuantities, product.id)}</small></div>
                <strong>{formatMoney(multiplyAtomic(product.priceAtomic, quantityFor(cartQuantities, product.id)), economy, language)}</strong>
              </div>
            ))}
          </section>
          <section className="payment-method card">
            <div><Wallet size={23} /><h2>{c("Fitimart virtual wallet", "Fitimart 虚拟钱包")}</h2><CheckCircle2 size={20} /></div>
            <p>{c("Available balance", "可用余额")} <strong>{formatMoney(balanceAtomic, economy, language)}</strong></p>
            <span>{c("Exact simulated settlement. No payment details or real funds are involved.", "精确模拟结算，不涉及付款信息或真实资金。")}</span>
            {compareAtomic(totalAtomic, balanceAtomic) > 0 && (
              <div className="insufficient-balance">
                <p>{c("Not enough virtual credit for this order.", "当前虚拟额度不足以支付这笔订单。")}</p>
                <button className="button" onClick={() => { const result = topUp("10000"); if (!result.ok) setMessage(result.message); }}>{c("Add 10,000 demo credit", "补充 10,000 体验额度")}</button>
              </div>
            )}
          </section>
        </div>
        <aside className="card cart-summary">
          <h2>{c("Ready when you are", "准备好了，就出发")}</h2>
          <div className="order-line"><span>{c("Subtotal", "商品小计")}</span><span>{formatMoney(totalAtomic, economy, language)}</span></div>
          <div className="order-line"><span>{c("Fees", "服务费")}</span><span>{formatMoney("0", economy, language)}</span></div>
          <div className="summary-total"><span>{c("You pay", "本次支付")}</span><strong>{formatMoney(totalAtomic, economy, language)}</strong></div>
          <div className="order-line"><span>{c("Balance after payment", "支付后余额")}</span><span>{compareAtomic(totalAtomic, balanceAtomic) <= 0 ? formatMoney(subtractAtomic(balanceAtomic, totalAtomic), economy, language) : "—"}</span></div>
          <label className="checkout-consent">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
            <span>{c("I understand this is a simulated purchase with no real payment, provider access, or asset ownership.", "我了解这是模拟购买，不涉及真实付款、服务访问权或资产所有权。")}</span>
          </label>
          {message && <p role="alert" className="commerce-error">{message}</p>}
          <button className="button button-primary button-lg" disabled={!accepted || compareAtomic(totalAtomic, balanceAtomic) > 0 || confirming} onClick={confirm}>
            {confirming ? c("Settling…", "结算中…") : c("Pay", "支付")} {formatMoney(totalAtomic, economy, language)} <ArrowRight size={16} />
          </button>
          <p className="checkout-note"><ShieldCheck size={13} /> {c("Simulation checkout · no real payment", "模拟结算 · 无真实扣款")}</p>
        </aside>
      </div>
    </>
  );
}
