"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { filterAndSortProducts } from "@/lib/search";
import type { Concept, Product, ProductType, SortOption } from "@/types/marketplace";

const productTypes: Array<ProductType | "ALL"> = ["ALL", "API", "TOKEN", "EXTENSION", "PLUGIN", "MCP", "MODEL", "AGENT", "DATASET", "PROTOCOL", "TOOL"];
const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "trending", label: "Trending" }, { value: "newest", label: "Newest" },
  { value: "most-collected", label: "Most collected" }, { value: "most-backed", label: "Most backed" },
  { value: "alphabetical", label: "Alphabetical" },
];

export function MarketplaceBrowser({ products, concepts }: { products: Product[]; concepts: Concept[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const status = searchParams.get("status") ?? "ALL";
  const type = searchParams.get("type") ?? "ALL";
  const tag = searchParams.get("tag") ?? "";
  const sort = (searchParams.get("sort") as SortOption) || "trending";

  const allItems = useMemo(() => [...products, ...concepts], [products, concepts]);
  const results = useMemo(() => filterAndSortProducts(allItems, { query, status, type, tag, sort }), [allItems, query, status, type, tag, sort]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "ALL") params.delete(key); else params.set(key, value);
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    updateParam("q", query.trim());
  };

  const filterContent = (
    <>
      <div className="filter-group">
        <span className="filter-label">Reality</span>
        {["ALL", "NOW", "FUTURE"].map((value) => <button className="filter-option" data-active={status === value} onClick={() => updateParam("status", value)} type="button" key={value}>{value === "ALL" ? "Everything" : value}<span>{value === "ALL" ? allItems.length : value === "NOW" ? products.length : concepts.length}</span></button>)}
      </div>
      <div className="filter-group">
        <span className="filter-label">Type</span>
        {productTypes.map((value) => <button className="filter-option" data-active={type === value} onClick={() => updateParam("type", value)} type="button" key={value}>{value === "ALL" ? "All types" : value}</button>)}
      </div>
      <div className="filter-group">
        <span className="filter-label">Capability</span>
        {["memory", "agents", "identity", "payments", "browser", "data", "automation", "code"].map((value) => <button className="filter-option" data-active={tag === value} onClick={() => updateParam("tag", tag === value ? "" : value)} type="button" key={value}>{value}</button>)}
      </div>
    </>
  );

  return (
    <div className="market-layout">
      <aside className="card filter-panel" data-open={filterOpen}>
        <div className="eyebrow" style={{ marginBottom: 18 }}><SlidersHorizontal size={13} /> Filters</div>
        {filterContent}
      </aside>
      <div>
        <div className="market-toolbar">
          <button className="button button-sm mobile-filter-button" type="button" onClick={() => setFilterOpen((value) => !value)}><Filter size={14} /> Filters</button>
          <span className="result-count">{results.length} capabilities</span>
          <select className="select-input" value={sort} onChange={(event) => updateParam("sort", event.target.value)} aria-label="Sort results">
            {sortOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </div>
        <form className="search-wrap" onSubmit={submitSearch} style={{ marginBottom: 24 }} role="search">
          <Search size={18} style={{ position: "absolute", left: 18, top: 17, color: "var(--muted)" }} />
          <input className="search-input" style={{ paddingLeft: 48 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search capabilities, providers, and concepts..." aria-label="Search marketplace" />
        </form>
        {results.length ? <div className="grid-products">{results.map((item, index) => <ProductCard key={item.id} product={item} featured={index === 0 && results.length > 4} />)}</div> : (
          <div className="empty-state">
            <div><div className="eyebrow">No results</div><h2>Nothing exactly matches.</h2><p>Try a broader capability or imagine the missing product.</p><button className="button button-future" type="button" onClick={() => router.push("/concepts/new")}>Imagine this</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
