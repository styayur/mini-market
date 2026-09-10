"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Boxes, Command, CornerDownLeft, Search, ShoppingBag } from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { searchMarketplace } from "@/lib/search";

const staticActions = [
  { label: "Marketplace", hint: "Browse NOW and FUTURE", href: "/marketplace", icon: Boxes },
  { label: "Future Market", hint: "Products that do not exist yet", href: "/future", icon: Bot },
  { label: "Concept Lab", hint: "Imagine a missing capability", href: "/concepts/new", icon: Command },
  { label: "Dashboard", hint: "Credits, library, and watchlist", href: "/dashboard", icon: Bot },
  { label: "Cart", hint: "Review simulated order", href: "/cart", icon: ShoppingBag },
];

export function CommandPalette() {
  const router = useRouter();
  const { products, allConcepts } = useMarketplace();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "/" && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const found = searchMarketplace(query, products, allConcepts);
    return [
      ...found.products.slice(0, 4).map((item) => ({ label: item.name, hint: `${item.type} · ${item.provider}`, href: `/marketplace/${item.slug}`, icon: Boxes })),
      ...found.concepts.slice(0, 4).map((item) => ({ label: item.name, hint: `FUTURE · ${item.type}`, href: `/concepts/${item.slug}`, icon: Bot })),
    ];
  }, [allConcepts, products, query]);

  const shown = query.trim() ? results : staticActions;

  const choose = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  if (!open) return null;

  return (
    <div className="command-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
      <div className="command-panel" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(event) => event.stopPropagation()}>
        <div className="search-wrap">
          <Search size={19} style={{ position: "absolute", left: 19, top: 21, color: "var(--muted)" }} />
          <input autoFocus className="command-input" style={{ paddingLeft: 49 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search capabilities, concepts, or actions..." aria-label="Command palette search" />
        </div>
        <div className="command-results">
          {shown.length ? shown.map((item) => {
            const Icon = item.icon;
            return (
              <button className="command-item" type="button" key={`${item.href}-${item.label}`} onClick={() => choose(item.href)}>
                <Icon size={18} />
                <span><strong style={{ color: "var(--foreground)", fontSize: 13 }}>{item.label}</strong><span>{item.hint}</span></span>
                <CornerDownLeft size={14} style={{ marginLeft: "auto", color: "var(--muted)" }} />
              </button>
            );
          }) : <div style={{ padding: 24, color: "var(--muted)", fontSize: 13 }}>No matching capability. Try Concept Lab.</div>}
        </div>
      </div>
    </div>
  );
}


