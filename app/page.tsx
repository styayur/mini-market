"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Boxes,
  Check,
  Code2,
  Cpu,
  Globe2,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { useLanguage } from "@/components/providers/language-provider";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { products } from "@/data/products";
import { concepts } from "@/data/concepts";
import { formatCredits } from "@/lib/format";

const departments = [
  { id: "all", en: "For you", zh: "为你精选", icon: Sparkles },
  { id: "models", en: "Models & tokens", zh: "模型与 Token", icon: Cpu },
  { id: "agents", en: "AI agents", zh: "智能体", icon: Boxes },
  { id: "code", en: "Code & build", zh: "编程与构建", icon: Code2 },
  { id: "voice", en: "Voice & vision", zh: "声音与视觉", icon: AudioLines },
  { id: "data", en: "Data & memory", zh: "数据与记忆", icon: Layers3 },
];

export default function Home() {
  const { language } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const { credits, hydrated, addBundle, cartProductIds } = useMarketplace();
  const [department, setDepartment] = useState("all");
  const [sort, setSort] = useState("popular");
  const catalog = products
    .filter(
      (p) =>
        department === "all" ||
        p.tags.includes(department) ||
        (department === "voice" && p.tags.includes("vision")),
    )
    .sort((a, b) =>
      sort === "price"
        ? a.demoPrice - b.demoPrice
        : sort === "new"
          ? b.createdAt.localeCompare(a.createdAt)
          : b.popularity - a.popularity,
    )
    .slice(0, 8);
  const bundle = products.filter((p) =>
    ["openai-api", "anthropic-api", "google-gemini-api"].includes(p.id),
  );
  const bundleAdded = bundle.every((p) => cartProductIds.includes(p.id));
  return (
    <div className="storefront">
      <div className="market-ribbon">
        <div className="container">
          <span>
            <span className="status-dot" />{" "}
            {c("The capability market is open", "能力市场，今日开市")}
          </span>
          <span>
            {c(
              "10,000 welcome Tokens. A whole new world to spend them in.",
              "10,000 枚欢迎 Token，去买一点未来。",
            )}
          </span>
          <Link href="/dashboard">
            {c("Your wallet", "我的钱包")} <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
      <div className="container">
        <section className="shop-hero">
          <div className="shop-hero-copy">
            <div className="edition-label">
              <span />{" "}
              {c(
                "A little market. Limitless possibilities.",
                "小小市场，无限可能。",
              )}
            </div>
            <h1>
              {c("Great ideas", "把灵感")}
              <br />
              {c("deserve a", "装进你的")}
              <br className="english-break" /> {c("shopping bag.", "购物袋。")}
            </h1>
            <p>
              {c(
                "A smarter model. A new superpower. A piece of tomorrow. Discover AI capabilities worth making yours.",
                "一个更聪明的模型，一项新技能，一块未来的拼图。用 Token 收集能力，把「如果可以」变成「我想拥有」。",
              )}
            </p>
            <div className="shop-hero-actions">
              <a href="#shop" className="button button-primary button-lg">
                {c("Find your next capability", "挑选我的下一项能力")}{" "}
                <ArrowRight size={16} />
              </a>
              <Link href="/future" className="hero-text-link">
                {c("Explore tomorrow", "逛逛未来市场")}{" "}
                <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="hero-footnote">
              <ShieldCheck size={14} />
              {c(
                "Experience market · demo Tokens · no real payments",
                "体验市场 · 虚拟 Token · 无真实支付",
              )}
            </div>
          </div>
          <div
            className="token-scene"
            aria-label={c(
              "Illustration of collectible AI capability passes",
              "AI 能力通行证插画",
            )}
          >
            <div className="scene-orbit orbit-one" />
            <div className="scene-orbit orbit-two" />
            <div className="floating-label label-top">
              <span className="status-dot" />{" "}
              {c("Possibility, delivered.", "让可能性，触手可及。")}
            </div>
            <div className="capability-pass pass-back">
              <span>Future access</span>
              <Globe2 size={66} strokeWidth={0.8} />
              <strong>
                Tomorrow
                <br />
                is in your bag.
              </strong>
            </div>
            <div className="capability-pass pass-front">
              <div className="pass-heading">
                <span>mini market</span>
                <Sparkles size={21} />
              </div>
              <div className="token-sculpture">
                <span>m</span>
              </div>
              <div className="pass-bottom">
                <div>
                  <small>{c("Your next superpower", "你的下一项超能力")}</small>
                  <strong>Intelligence.</strong>
                </div>
                <ArrowUpRight size={25} />
              </div>
              <div className="pass-stub">
                <span>AI capability pass</span>
                <span>✦ 001</span>
              </div>
            </div>
            <div className="floating-label label-bottom">
              <span className="tiny-check">
                <Check size={14} />
              </span>
              <div>
                <strong>
                  {c("A little more possible.", "又多了一种可能。")}
                </strong>
                <small>
                  {c(
                    "Add a capability. Start something.",
                    "收下一项能力，开始新的创造。",
                  )}
                </small>
              </div>
            </div>
            <span className="scene-caption">
              Collect capabilities. Create possibilities.
            </span>
          </div>
        </section>
        <section
          className="shop-benefits"
          aria-label={c("How the market works", "市场体验方式")}
        >
          <div>
            <Wallet size={21} />
            <span>
              <strong>
                {c("Your first 10,000 are on us", "10,000 Token，入场即拥有")}
              </strong>
              <small>
                {c(
                  "Demo balance. Real discovery.",
                  "用体验余额，发现真正想要的能力。",
                )}
              </small>
            </span>
          </div>
          <div>
            <Zap size={21} />
            <span>
              <strong>
                {c(
                  "From bag to library, instantly",
                  "从购物袋到能力库，即刻入手",
                )}
              </strong>
              <small>
                {c(
                  "Collect passes and keep your receipts.",
                  "收集能力通行证，留存每一笔订单。",
                )}
              </small>
            </span>
          </div>
          <div>
            <Globe2 size={21} />
            <span>
              <strong>
                {c("Shop today. Imagine tomorrow.", "选购今天，想象明天")}
              </strong>
              <small>
                {c(
                  "Real tools meet speculative ideas.",
                  "现实工具与未来概念，在这里相遇。",
                )}
              </small>
            </span>
          </div>
        </section>
        <section className="shop-section" id="shop">
          <div className="shop-section-heading">
            <div>
              <span className="section-overline">
                {c("Find your edge", "给创造力，加一点装备")}
              </span>
              <h2>{c("Good things in store.", "值得入手的好能力。")}</h2>
            </div>
            <Link href="/marketplace">
              {c("Browse all capabilities", "浏览全部能力")}{" "}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="department-bar">
            <div
              className="department-tabs"
              role="group"
              aria-label={c("Shop by capability", "按能力选购")}
            >
              {departments.map(({ id, en, zh, icon: Icon }) => (
                <button
                  type="button"
                  aria-pressed={department === id}
                  key={id}
                  onClick={() => setDepartment(id)}
                >
                  <Icon size={16} />
                  {c(en, zh)}
                </button>
              ))}
            </div>
            <select
              aria-label={c("Sort products", "商品排序")}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="popular">{c("Popular picks", "人气精选")}</option>
              <option value="price">
                {c("Price: low to high", "价格从低到高")}
              </option>
              <option value="new">{c("New arrivals", "最新上架")}</option>
            </select>
          </div>
          <div className="shop-product-grid">
            {catalog.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
          {!catalog.length && (
            <div className="empty-state">
              <p>
                {c(
                  "More capabilities are on the way. Explore all picks for now.",
                  "更多能力正在路上，先看看全部精选吧。",
                )}
              </p>
              <button className="button" onClick={() => setDepartment("all")}>
                {c("Show all", "显示全部")}
              </button>
            </div>
          )}
        </section>
        <section className="collection-banner">
          <div className="collection-visual" aria-hidden="true">
            <span>
              <Sparkles />
            </span>
            <span>
              <Cpu />
            </span>
            <span>
              <Globe2 />
            </span>
          </div>
          <div>
            <span className="section-overline">
              {c("The starter collection", "灵感启动套装")}
            </span>
            <h2>
              {c(
                "Three minds. Your next big idea.",
                "三个大脑，下一个好点子。",
              )}
            </h2>
            <p>
              {c(
                "OpenAI + Anthropic + Gemini. Collect three model passes in one bag.",
                "OpenAI + Anthropic + Gemini，一次收下三张模型能力通行证。",
              )}
            </p>
          </div>
          <div className="collection-buy">
            <strong>
              ◈ {formatCredits(bundle.reduce((sum, p) => sum + p.demoPrice, 0))}
              <small> Token</small>
            </strong>
            <button
              className="button button-primary"
              disabled={!hydrated || bundleAdded}
              onClick={() => addBundle(bundle.map((p) => p.id))}
            >
              {bundleAdded
                ? c("In your bag", "已在购物袋")
                : c("Add collection", "整套加入购物袋")}{" "}
              {bundleAdded ? <Check size={15} /> : <ArrowRight size={15} />}
            </button>
          </div>
        </section>
        <section className="shop-section future-shelf">
          <div className="shop-section-heading">
            <div>
              <span className="section-overline">
                {c("The next frontier", "为明天投一票")}
              </span>
              <h2>{c("Not here. Not yet.", "还没实现，但值得期待。")}</h2>
            </div>
            <Link href="/future">
              {c("Enter the future market", "进入未来市场")}{" "}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <p className="shelf-intro">
            {c(
              "What would you buy if anything were possible? Back an idea with demo Tokens and help shape the wishlist for tomorrow.",
              "如果一切皆有可能，你最想买什么？用体验 Token 支持一个想法，把期待留在未来的愿望清单上。",
            )}
          </p>
          <div className="future-teaser-grid">
            {concepts.slice(0, 3).map((concept, i) => (
              <Link
                href={`/concepts/${concept.slug}`}
                key={concept.id}
                className={`future-teaser future-tone-${i}`}
              >
                <div className="card-topline">
                  <span className="badge badge-future">
                    {c("Future concept", "未来概念")}
                  </span>
                  <ArrowUpRight size={20} />
                </div>
                <div className="concept-art" aria-hidden="true">
                  {i === 0 ? (
                    <Layers3 size={68} strokeWidth={1} />
                  ) : i === 1 ? (
                    <Globe2 size={68} strokeWidth={1} />
                  ) : (
                    <Boxes size={68} strokeWidth={1} />
                  )}
                </div>
                <h3>{concept.name}</h3>
                <p>{concept.tagline}</p>
                <div className="future-teaser-footer">
                  <span>
                    {c("Explore & back this idea", "了解并支持这个想法")}
                  </span>
                  <span>{c("Unbuilt", "尚未实现")}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="wallet-invite">
          <div>
            <Wallet size={28} />
            <h2>
              {c("Your next possibility is waiting.", "下一种可能，等你入手。")}
            </h2>
            <p>
              {c(
                "Your wallet is ready. The rest is curiosity.",
                "钱包已经准备好，剩下的交给好奇心。",
              )}
            </p>
          </div>
          <Link href="/dashboard" className="button button-lg">
            ◈ {hydrated ? formatCredits(credits) : "—"} Token{" "}
            <ArrowRight size={16} />
          </Link>
        </section>
        <form
          className="bottom-search"
          action={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/search/`}
          role="search"
        >
          <Search size={19} />
          <input
            name="q"
            aria-label={c("Find a capability", "寻找一种能力")}
            placeholder={c(
              "Something specific in mind? Search the market…",
              "已经有想法了？搜索你想要的能力…",
            )}
          />
          <button type="submit" aria-label={c("Search", "搜索")}>
            <ArrowRight size={19} />
          </button>
        </form>
      </div>
    </div>
  );
}
