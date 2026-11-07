"use client";

import Link from "next/link";
import { conceptHref, productHref } from "@/lib/links";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Download,
  Heart,
  Library,
  Plus,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { ProductCard } from "@/components/product/product-card";
import { ConceptCard } from "@/components/concept/concept-card";
import { downloadReceipt } from "@/components/product/checkout-view";
import { formatDateTime, formatMoney } from "@/lib/format";
import { multiplyAtomic, parseAmountToAtomic } from "@/lib/money";

export function DashboardStats() {
  const {
    balanceAtomic,
    economy,
    libraryProductIds,
    createdConcepts,
    watchedConceptIds,
    products,
    allConcepts,
    hydrated,
    orders,
    topUps,
    topUp,
    backings,
    walletAdjustments,
  } = useMarketplace();
  const { language } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const [amount, setAmount] = useState("1000");
  const [tab, setTab] = useState("orders");
  let amountPreview = "0";
  try { amountPreview = parseAmountToAtomic(amount); } catch { amountPreview = "0"; }
  const library = products.filter((p) => libraryProductIds.includes(p.id));
  const watched = allConcepts.filter((p) => watchedConceptIds.includes(p.id));
  return (
    <div className="wallet-page">
      <div className="commerce-heading">
        <span className="section-overline">
          {c("Your corner of the market", "你的市场小天地")}
        </span>
        <h1>{c("A little more capable.", "今天，又多了一点能力。")}</h1>
        <p>
          {c(
            "Your wallet, your collection, your next possibility.",
            "钱包、收藏与订单，每一次心动都有迹可循。",
          )}
        </p>
      </div>
      <div className="wallet-layout">
        <section className="wallet-card">
          <div>
            <Wallet size={24} />
            <span>{c("Virtual wallet", "虚拟钱包")}</span>
            <span className="wallet-status">
              {c("Ready to shop", "随时可购")}
            </span>
          </div>
          <small>{c("Available balance", "可用余额")}</small>
          <strong className="wallet-value">
            {hydrated ? formatMoney(balanceAtomic, economy, language) : "—"}
          </strong>
          <p>
            {c(
              "Your imagination has a spending account.",
              "给你的想象力，一个专属账户。",
            )}
          </p>
          <footer>
            <span>Fitimart virtual member</span>
            <span>◈ FITI / 001</span>
          </footer>
        </section>
        <section className="wallet-refill card">
          <div className="card-topline">
            <h2>{c("A little wallet boost", "为钱包补充一点灵感")}</h2>
            <Plus size={22} />
          </div>
          <p>
            {c(
              "Add free simulated credit and keep exploring.",
              "免费补充模拟额度，继续探索你想拥有的内容。",
            )}
          </p>
          <div
            className="topup-options"
            role="group"
            aria-label={c("Top-up amount", "补充数量")}
          >
            {[1000, 5000, 10000].map((value) => (
              <button
                aria-pressed={amount === String(value)}
                onClick={() => setAmount(String(value))}
                key={value}
              >
                {formatMoney(parseAmountToAtomic(value), economy, language, false)}
                <small>{economy.currencyLabel}</small>
              </button>
            ))}
          </div>
          <label className="form-field" style={{ marginTop: 16 }}>
            <span>{c("Custom amount", "自定义金额")}</span>
            <input className="form-input" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} aria-label={c("Custom top-up amount", "自定义补充金额")} />
          </label>
          <button className="button button-primary" disabled={!hydrated} onClick={() => topUp(amount)}>
            <Plus size={16} /> {c("Add", "补充")} {formatMoney(amountPreview, economy, language)}
          </button>
          <small>
            {c(
              "Always free. Virtual credit has no cash value.",
              "始终免费。虚拟额度不可兑换现金。",
            )}
          </small>
        </section>
      </div>
      <div className="wallet-metrics">
        <Link href="/library">
          <Library size={20} />
          <strong>{library.length}</strong>
          <span>{c("Collected capabilities", "已收藏能力")}</span>
          <ArrowUpRight size={16} />
        </Link>
        <a href="#activity">
          <ReceiptText size={20} />
          <strong>{orders.length}</strong>
          <span>{c("Completed orders", "已完成订单")}</span>
          <ArrowUpRight size={16} />
        </a>
        <Link href="/favorites">
          <Heart size={20} />
          <strong>{watched.length}</strong>
          <span>{c("Future ideas watched", "已关注未来概念")}</span>
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <section className="wallet-activity" id="activity">
        <div className="shop-section-heading">
          <h2>{c("Your market activity", "你的市场足迹")}</h2>
          <div className="activity-tabs">
            <button
              aria-pressed={tab === "orders"}
              onClick={() => setTab("orders")}
            >
              {c("Orders", "购买订单")}
            </button>
            <button
              aria-pressed={tab === "backings"}
              onClick={() => setTab("backings")}
            >
              {c("Concept support", "概念支持")}
            </button>
            <button
              aria-pressed={tab === "topups"}
              onClick={() => setTab("topups")}
            >
              {c("Top-ups", "余额补充")}
            </button>
          </div>
        </div>
        {tab === "orders" ? (
          orders.length ? (
            <div className="orders-list">
              {orders.map((order) => (
                <details className="order-record" key={order.id}>
                  <summary>
                    <span className="order-record-icon">
                      <CheckCircle2 size={20} />
                    </span>
                    <span>
                      <strong>{order.id}</strong>
                      <small>
                        {new Date(order.createdAt).toLocaleString(
                          language === "zh" ? "zh-CN" : "en-US",
                        )}{" "}
                        · {order.items.reduce((n, i) => n + i.quantity, 0)}{" "}
                        {c("passes", "张通行证")}
                      </small>
                    </span>
                    <strong>−{formatMoney(order.totalAtomic, economy, language)}</strong>
                    <span className="badge badge-live">
                      {c("Complete", "已完成")}
                    </span>
                  </summary>
                  <div className="order-record-detail">
                    {order.items.map((item) => (
                      <div className="order-line" key={item.productId}>
                        {(() => { const product = products.find((entry) => entry.id === item.productId); return product ? <Link href={productHref(product)}>{item.name} × {item.quantity}</Link> : <span>{item.name} × {item.quantity}</span>; })()}
                        <span>
                          {formatMoney(multiplyAtomic(item.unitPriceAtomic, item.quantity), economy, language)}
                        </span>
                      </div>
                    ))}
                    <button
                      className="button button-sm"
                      onClick={() => downloadReceipt(order, language)}
                    >
                      <Download size={14} />
                      {c("Save receipt", "保存收据")}
                    </button>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div>
                <ReceiptText size={30} />
                <h2>
                  {c("Your first good find awaits.", "第一笔心动，还在等你。")}
                </h2>
                <p>
                  {c(
                    "Completed orders and receipts will appear here.",
                    "完成购买后，可以在这里查看订单与收据。",
                  )}
                </p>
                <Link href="/marketplace" className="button button-primary">
                  {c("Go shopping", "去逛逛")} <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          )
        ) : tab === "backings" ? (
          <div className="orders-list">
            {backings.length ? (
              backings.map((backing) => {
                const concept = allConcepts.find(
                  (item) => item.id === backing.conceptId,
                );
                return (
                  <div className="topup-row" key={backing.id}>
                    <Heart size={18} />
                    <span>
                      {concept ? (
                        <Link href={conceptHref(concept)}>{concept.name}</Link>
                      ) : (
                        backing.conceptId
                      )}
                      <small>
                        {new Date(backing.createdAt).toLocaleString(
                          language === "zh" ? "zh-CN" : "en-US",
                        )}
                      </small>
                    </span>
                    <strong>−{formatMoney(backing.amountAtomic, economy, language)}</strong>
                  </div>
                );
              })
            ) : (
              <div className="topup-row">
                {c(
                  "No contributions yet. Find a future worth backing.",
                  "还没有支持记录，去寻找一个值得期待的未来吧。",
                )}
                <Link href="/future" className="button button-sm">
                  {c("Explore", "去探索")}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="orders-list">
            <div className="topup-row">
              <Wallet size={18} />
              <span>{c("Configured initial credit", "配置的初始额度")}</span>
              <strong>{formatMoney(economy.initialCreditAtomic, economy, language)}</strong>
            </div>
            {walletAdjustments.map((item) => (
              <div className="topup-row" key={item.id}>
                <Wallet size={18} />
                <span>{c("Explicit wallet reset", "显式钱包重置")}<small>{formatDateTime(item.createdAt, language)}</small></span>
                <strong>{formatMoney(item.nextAtomic, economy, language)}</strong>
              </div>
            ))}
            {topUps.map((item) => (
              <div className="topup-row" key={item.id}>
                <Plus size={18} />
                <span>
                  {c("Demo wallet top-up", "体验余额补充")}
                  <small>
                    {new Date(item.createdAt).toLocaleString(
                      language === "zh" ? "zh-CN" : "en-US",
                    )}
                  </small>
                </span>
                <strong>+{formatMoney(item.amountAtomic, economy, language)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="shop-section">
        <div className="shop-section-heading">
          <h2>{c("Made yours", "已经收入囊中")}</h2>
          <Link href="/library">
            {c("Open collection", "打开收藏库")} <ArrowUpRight size={15} />
          </Link>
        </div>
        {library.length ? (
          <div className="shop-product-grid">
            {library.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="muted">
            {c(
              "Your collection grows with every purchase.",
              "每一次购买，都会让你的收藏库更丰富。",
            )}
          </p>
        )}
      </section>
      {(watched.length > 0 || createdConcepts.length > 0) && (
        <section className="shop-section">
          <div className="shop-section-heading">
            <h2>{c("Your tomorrow", "你期待的明天")}</h2>
            <Link href="/concepts/new">
              {c("Create a concept", "发布新概念")} <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="grid-products">
            {[
              ...new Map(
                [...createdConcepts, ...watched].map((p) => [p.id, p]),
              ).values(),
            ].map((p) => (
              <ConceptCard key={p.id} concept={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
