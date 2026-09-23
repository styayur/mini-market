"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { filterAndSortProducts } from "@/lib/search";
import type {
  Concept,
  Product,
  ProductType,
  SortOption,
} from "@/types/marketplace";

const productTypes: Array<ProductType | "ALL"> = [
  "ALL",
  "API",
  "TOKEN",
  "EXTENSION",
  "PLUGIN",
  "MCP",
  "MODEL",
  "AGENT",
  "DATASET",
  "PROTOCOL",
  "TOOL",
];
const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "most-collected", label: "Most collected" },
  { value: "most-backed", label: "Most backed" },
  { value: "alphabetical", label: "Alphabetical" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
];

export function MarketplaceBrowser({
  products,
  concepts,
}: {
  products: Product[];
  concepts: Concept[];
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const sortLabels: Record<string, string> = {
    trending: "编辑推荐",
    newest: "最新上架",
    "most-collected": "收藏示例排行",
    "most-backed": "支持示例排行",
    alphabetical: "名称排序",
    "price-low": "价格从低到高",
    "price-high": "价格从高到低",
  };
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const status = searchParams.get("status") ?? "ALL";
  const type = searchParams.get("type") ?? "ALL";
  const tag = searchParams.get("tag") ?? "";
  const sort = (searchParams.get("sort") as SortOption) || "trending";

  const allItems = useMemo(
    () => [...products, ...concepts],
    [products, concepts],
  );
  const results = useMemo(
    () => filterAndSortProducts(allItems, { query, status, type, tag, sort }),
    [allItems, query, status, type, tag, sort],
  );

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "ALL") params.delete(key);
    else params.set(key, value);
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    updateParam("q", query.trim());
  };

  const filterContent = (
    <>
      <div className="filter-group">
        <span className="filter-label">{c("Availability", "商品状态")}</span>
        {["ALL", "NOW", "FUTURE"].map((value) => (
          <button
            className="filter-option"
            data-active={status === value}
            onClick={() => updateParam("status", value)}
            type="button"
            key={value}
          >
            {value === "ALL"
              ? c("Everything", "全部")
              : value === "NOW"
                ? c("Available now", "现实能力")
                : c("Future concepts", "未来概念")}
            <span>
              {value === "ALL"
                ? allItems.length
                : value === "NOW"
                  ? products.length
                  : concepts.length}
            </span>
          </button>
        ))}
      </div>
      <div className="filter-group">
        <span className="filter-label">{c("Type", "商品类型")}</span>
        {productTypes.map((value) => (
          <button
            className="filter-option"
            data-active={type === value}
            onClick={() => updateParam("type", value)}
            type="button"
            key={value}
          >
            {value === "ALL" ? c("All types", "全部类型") : value}
          </button>
        ))}
      </div>
      <div className="filter-group">
        <span className="filter-label">{c("Capability", "能力分类")}</span>
        {[
          "memory",
          "agents",
          "identity",
          "payments",
          "browser",
          "data",
          "automation",
          "code",
        ].map((value) => (
          <button
            className="filter-option"
            data-active={tag === value}
            onClick={() => updateParam("tag", tag === value ? "" : value)}
            type="button"
            key={value}
          >
            {value}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="market-layout">
      <aside className="card filter-panel" data-open={filterOpen}>
        <div className="eyebrow" style={{ marginBottom: 18 }}>
          <SlidersHorizontal size={13} /> {c("Filters", "筛选")}
        </div>
        {filterContent}
      </aside>
      <div>
        <div className="market-toolbar">
          <button
            className="button button-sm mobile-filter-button"
            type="button"
            onClick={() => setFilterOpen((value) => !value)}
          >
            <Filter size={14} /> {c("Filters", "筛选")}
          </button>
          <span className="result-count">
            {results.length} {c("capabilities", "项能力")}
          </span>
          <select
            className="select-input"
            value={sort}
            onChange={(event) => updateParam("sort", event.target.value)}
            aria-label="Sort results"
          >
            {sortOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {language === "zh" ? sortLabels[option.value] : option.label}
              </option>
            ))}
          </select>
        </div>
        <form
          className="search-wrap"
          onSubmit={submitSearch}
          style={{ marginBottom: 24 }}
          role="search"
        >
          <Search
            size={18}
            style={{
              position: "absolute",
              left: 18,
              top: 17,
              color: "var(--muted)",
            }}
          />
          <input
            className="search-input"
            style={{ paddingLeft: 48 }}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={c(
              "Search capabilities, providers, and concepts...",
              "搜索能力、提供商或概念…",
            )}
            aria-label={c("Search marketplace", "搜索商店")}
          />
        </form>
        {results.length ? (
          <div className="grid-products">
            {results.map((item, index) => (
              <ProductCard
                key={item.id}
                product={item}
                featured={index === 0 && results.length > 4}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div>
              <div className="eyebrow">No results</div>
              <h2>{c("Nothing exactly matches.", "暂时没有匹配的能力。")}</h2>
              <p>
                {c(
                  "Try a broader capability or imagine the missing product.",
                  "换个关键词，或创造一个你期待的概念。",
                )}
              </p>
              <button
                className="button button-future"
                type="button"
                onClick={() => router.push("/concepts/new")}
              >
                {c("Imagine this", "创建这个概念")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
