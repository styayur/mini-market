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
          <Link href="/" className="brand">
            <span className="brand-mark">
              <ShoppingBag size={20} />
            </span>
            <span>
              mini<span className="brand-light">market</span>.
            </span>
          </Link>
          <p
            className="lead"
            style={{ maxWidth: 330, marginTop: 18, fontSize: 13 }}
          >
            {c(
              "Collect capabilities. Create possibilities. A little market for what comes next.",
              "收集能力，创造可能。一家关于今天和明天的小小市场。",
            )}
          </p>
        </div>
        <div>
          <h3>{c("The market", "逛逛市场")}</h3>
          <Link className="footer-link" href="/marketplace">
            {c("Capability shop", "能力商店")}
          </Link>
          <Link className="footer-link" href="/future">
            {c("Future market", "未来市场")}
          </Link>
          <Link className="footer-link" href="/concepts/new">
            {c("Concept lab", "概念实验室")}
          </Link>
        </div>
        <div>
          <h3>{c("Your space", "我的空间")}</h3>
          <Link className="footer-link" href="/dashboard">
            {c("Wallet & orders", "钱包与订单")}
          </Link>
          <Link className="footer-link" href="/library">
            {c("My collection", "能力收藏库")}
          </Link>
          <Link className="footer-link" href="/favorites">
            {c("Wishlist", "心愿单")}
          </Link>
        </div>
        <div>
          <h3>{c("About Mini Market", "关于 Mini Market")}</h3>
          <Link className="footer-link" href="/manifesto">
            {c("Our idea", "我们的想法")}
          </Link>
          <Link className="footer-link" href="/settings">
            {c("Experience settings", "体验设置")}
          </Link>
          <a
            className="footer-link"
            href="https://github.com/styayur/mini-market"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Mini Market</span>
        <span>
          {c(
            "An experience market. Demo Tokens, local collections, no real payments.",
            "概念体验市场 · 虚拟 Token · 本地收藏 · 无真实支付",
          )}
        </span>
      </div>
    </footer>
  );
}
