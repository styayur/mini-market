"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  Wallet,
  X,
} from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { CommandPalette } from "@/components/layout/command-palette";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { formatCredits } from "@/lib/format";
import { quantityFor } from "@/lib/commerce";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { cartProductIds, cartQuantities, credits, hydrated } =
    useMarketplace();
  const { language } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const items = [
    { href: "/", label: c("Discover", "发现") },
    { href: "/marketplace", label: c("Marketplace", "能力商店") },
    { href: "/future", label: c("Future market", "未来市场") },
    { href: "/library", label: c("My collection", "我的收藏库") },
  ];
  const count = cartProductIds.reduce(
    (n, id) => n + quantityFor(cartQuantities, id),
    0,
  );
  return (
    <>
      <header className="site-header">
        <div className="container navbar">
          <Link href="/" className="brand" aria-label="Mini Market home">
            <span className="brand-mark">
              <ShoppingBag size={20} />
            </span>
            <span>
              mini<span className="brand-light">market</span>
              <span className="brand-period">.</span>
            </span>
          </Link>
          <nav
            className="nav-links"
            aria-label={c("Primary navigation", "主导航")}
          >
            {items.map((item) => (
              <Link
                className="nav-link"
                aria-current={
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href))
                    ? "page"
                    : undefined
                }
                href={item.href}
                key={item.href}
              >
                {item.label}
                {item.href === "/future" && (
                  <span className="nav-new">Next</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <button
              className="icon-button"
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event("open-command-palette"))
              }
              aria-label={c("Search market", "搜索市场")}
              title="Ctrl / ⌘ K"
            >
              <Search size={18} />
            </button>
            <LanguageToggle />
            <Link
              className="icon-button nav-favorites"
              href="/favorites"
              aria-label={c("Favorites", "心愿单")}
            >
              <Heart size={18} />
            </Link>
            <Link className="wallet-button" href="/dashboard">
              <Wallet size={16} />
              <span>
                {hydrated ? formatCredits(credits) : "—"}
                <small> Token</small>
              </span>
            </Link>
            <Link
              className="bag-button"
              href="/cart"
              aria-label={c(
                `Shopping bag, ${count} items`,
                `购物袋，${count} 件商品`,
              )}
            >
              <ShoppingBag size={18} />
              <span>{count}</span>
            </Link>
            <button
              className="icon-button mobile-menu-button"
              type="button"
              aria-expanded={mobileOpen}
              aria-label={c("Toggle navigation", "展开导航")}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav
            className="mobile-menu"
            aria-label={c("Mobile navigation", "移动导航")}
          >
            {items.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
              {c("Wallet & orders", "钱包与订单")} <ArrowUpRight size={14} />
            </Link>
            <Link href="/concepts/new" onClick={() => setMobileOpen(false)}>
              {c("Create a concept", "发布新概念")}
            </Link>
          </nav>
        )}
      </header>
      <CommandPalette />
    </>
  );
}
