"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, FlaskConical, Search, Sparkles } from "lucide-react";
import { ConceptCard } from "@/components/concept/concept-card";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { useLanguage } from "@/components/providers/language-provider";

export function FutureMarket() {
  const { allConcepts, watchedConceptIds, getBackingTotal } = useMarketplace();
  const { language } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const [sort, setSort] = useState("trending");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(
    () =>
      allConcepts.filter(
        (p) =>
          (!query ||
            `${p.name} ${p.tagline} ${p.tags.join(" ")}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (filter === "all" ||
            (filter === "watched"
              ? watchedConceptIds.includes(p.id)
              : filter === "ambitious"
                ? p.ambition === "INFRASTRUCTURE" || p.ambition === "AMBITIOUS"
                : p.isUserCreated)),
      ),
    [allConcepts, filter, query, watchedConceptIds],
  );
  const sorted = [...filtered].sort((a, b) =>
    sort === "newest"
      ? b.createdAt.localeCompare(a.createdAt)
      : sort === "backed"
        ? getBackingTotal(b.id) - getBackingTotal(a.id)
        : b.popularity - a.popularity,
  );
  return (
    <>
      <section className="future-market-hero">
        <div>
          <span className="section-overline">
            <FlaskConical size={14} />{" "}
            {c("The market for what comes next", "为尚未实现的可能，开一家店")}
          </span>
          <h1>{c("Tomorrow has a wishlist.", "未来，也有一张愿望清单。")}</h1>
          <p>
            {c(
              "A memory that travels with you. Agents that work together. Discover the capabilities you wish existed, and put your Tokens behind them.",
              "随身携带的记忆，彼此协作的智能体。发现那些你希望存在的能力，用 Token 为它们投一票。",
            )}
          </p>
          <Link className="button button-future" href="/concepts/new">
            <Sparkles size={16} />
            {c("Imagine a new capability", "发布你的未来想象")}
          </Link>
        </div>
        <div className="future-orb" aria-hidden="true">
          <FlaskConical size={92} strokeWidth={0.8} />
          <span>What if?</span>
        </div>
      </section>
      <div className="future-market-note">
        <Sparkles size={17} />
        <span>
          {c(
            "Every item is an unbuilt concept. Support uses demo Tokens; market rankings and seed totals are illustrative.",
            "这里的每件商品都是尚未实现的概念。支持使用体验 Token，初始排行与支持量为示例数据。",
          )}
        </span>
      </div>
      <div className="department-bar">
        <div
          className="department-tabs"
          role="group"
          aria-label={c("Concept collection", "概念分类")}
        >
          {[
            ["all", c("All possibilities", "全部可能")],
            ["ambitious", c("Big ambitions", "大胆构想")],
            ["watched", c("My watchlist", "我的关注")],
            ["mine", c("My concepts", "我的概念")],
          ].map(([id, name]) => (
            <button
              key={id}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {name}
            </button>
          ))}
        </div>
        <select
          aria-label={c("Sort concepts", "概念排序")}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="trending">{c("Editor's order", "编辑推荐")}</option>
          <option value="newest">{c("Recently imagined", "最新想象")}</option>
          <option value="backed">
            {c("Most demo support", "体验支持最多")}
          </option>
        </select>
      </div>
      <label className="future-search">
        <Search size={17} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={c(
            "Find an idea: memory, identity, agents…",
            "搜索概念：memory、identity、agents…",
          )}
          aria-label={c("Search concepts", "搜索概念")}
        />
        <span>{sorted.length}</span>
      </label>
      {sorted.length ? (
        <div className="grid-products">
          {sorted.map((p) => (
            <ConceptCard key={p.id} concept={p} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div>
            <h2>
              {c("An idea could start here.", "一个好想法，可以从这里开始。")}
            </h2>
            <p>
              {c(
                "Try another search, follow a concept, or create your own.",
                "换个关键词，关注一个概念，或者亲手创造你的想法。",
              )}
            </p>
            <button
              className="button"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
            >
              {c("Show all concepts", "查看全部概念")}
            </button>
            <Link className="button button-future" href="/concepts/new">
              {c("Create a concept", "创建概念")}
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
