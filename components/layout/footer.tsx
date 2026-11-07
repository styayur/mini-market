"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
export function Footer() {
  const { language } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link href="/" className="brand" aria-label="Fitimart home">
            <span className="brand-mark"><ShoppingBag size={20} /></span>
            <span>fiti<span className="brand-light">mart</span>.</span>
          </Link>
          <p className="lead" style={{ maxWidth: 340, marginTop: 18, fontSize: 13 }}>
            {c("A static, local-first marketplace for open-web discoveries and speculative ideas.", "一个静态、本地优先的市场，收集开放网络的发现与尚未实现的想法。")}
          </p>
        </div>
        <div>
          <h3>{c("The market", "逛逛市场")}</h3>
          <Link className="footer-link" href="/marketplace">{c("Marketplace", "市场")}</Link>
          <Link className="footer-link" href="/feeds">{c("RSS feeds", "订阅源")}</Link>
          <Link className="footer-link" href="/future">{c("Future concepts", "未来概念")}</Link>
          <Link className="footer-link" href="/concepts/new">{c("Concept lab", "概念实验室")}</Link>
        </div>
        <div>
          <h3>{c("Your space", "我的空间")}</h3>
          <Link className="footer-link" href="/dashboard">{c("Wallet & orders", "钱包与订单")}</Link>
          <Link className="footer-link" href="/library">{c("My collection", "我的收藏库")}</Link>
          <Link className="footer-link" href="/favorites">{c("Favorites", "心愿单")}</Link>
        </div>
        <div>
          <h3>{c("About Fitimart", "关于 Fitimart")}</h3>
          <Link className="footer-link" href="/manifesto">{c("Our idea", "我们的想法")}</Link>
          <Link className="footer-link" href="/settings">{c("Settings & data", "设置与数据")}</Link>
          <a className="footer-link" href="https://github.com/styayur/fitimart" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Fitimart</span>
        <span>{c("Simulation only. No real payments or ownership. Public feeds and translations are best-effort third-party services.", "仅供模拟，不涉及真实付款或所有权。公共订阅与翻译服务均为尽力而为的第三方能力。")}</span>
      </div>
    </footer>
  );
}
