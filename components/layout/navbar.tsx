"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Heart, Menu, Search, ShoppingBag, Sparkles, UserRound, X } from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { CommandPalette } from "@/components/layout/command-palette";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { formatCredits } from "@/lib/format";

const navItems = [
  { href: "/marketplace", key: "nav.explore" },
  { href: "/marketplace?status=NOW", key: "nav.now" },
  { href: "/future", key: "nav.future" },
  { href: "/marketplace#categories", key: "nav.categories" },
  { href: "/concepts/new", key: "nav.conceptLab" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { cartProductIds, favoriteProductIds, credits } = useMarketplace();
  const { t } = useLanguage();
  const openCommand = () => window.dispatchEvent(new Event("open-command-palette"));

  return (
    <>
      <header className="site-header">
        <div className="container-wide navbar">
          <Link href="/" className="brand" aria-label="Mini Market home"><span className="brand-mark">MM</span> MINI MARKET</Link>
          <nav className="nav-links" aria-label="Primary navigation">
            {navItems.map((item) => {
              const base = item.href.split("?")[0].split("#")[0];
              return <Link className="nav-link" aria-current={pathname === base ? "page" : undefined} href={item.href} key={item.key}>{t(item.key)}</Link>;
            })}
          </nav>
          <div className="nav-actions">
            <form className="search-wrap search-desktop" action={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/search/`} role="search">
              <Search size={15} className="search-compact-icon" />
              <input className="search-input search-compact" name="q" placeholder={t("nav.search")} aria-label={t("nav.search")} />
            </form>
            <button className="icon-button search-desktop" type="button" onClick={openCommand} aria-label="Open command palette" title="Command palette (Ctrl+K)"><Sparkles size={17} /></button>
            <LanguageToggle />
            <Link className="icon-button" href="/favorites" aria-label={`${t("nav.favorites")}, ${favoriteProductIds.length}`}><Heart size={17} />{favoriteProductIds.length > 0 && <span className="count-badge">{favoriteProductIds.length}</span>}</Link>
            <Link className="icon-button" href="/cart" aria-label={`${t("nav.cart")}, ${cartProductIds.length}`}><ShoppingBag size={17} />{cartProductIds.length > 0 && <span className="count-badge">{cartProductIds.length}</span>}</Link>
            <Link className="button button-sm" href="/dashboard" style={{ marginLeft: 3 }}>
              <UserRound size={14} /><span className="search-desktop">{formatCredits(credits)}</span>
            </Link>
            <button className="icon-button mobile-menu-button" type="button" aria-expanded={mobileOpen} aria-label="Toggle navigation" onClick={() => setMobileOpen((value) => !value)}>
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="mobile-menu" aria-label="Mobile navigation">
            {navItems.map((item) => <Link href={item.href} key={item.key} onClick={() => setMobileOpen(false)}>{t(item.key)}</Link>)}
            <Link href="/dashboard" onClick={() => setMobileOpen(false)}>{t("nav.dashboard")}</Link>
            <Link href="/library" onClick={() => setMobileOpen(false)}>{t("nav.library")}</Link>
          </nav>
        )}
      </header>
      <CommandPalette />
    </>
  );
}

