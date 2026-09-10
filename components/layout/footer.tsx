"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div><Link href="/" className="brand"><span className="brand-mark">MM</span> MINI MARKET</Link><p className="lead" style={{ maxWidth: 390, marginTop: 18, fontSize: 14 }}>{t("footer.description")}</p></div>
        <div><h3>{t("nav.explore")}</h3><Link className="footer-link" href="/marketplace">{t("nav.now")}</Link><Link className="footer-link" href="/future">{t("nav.future")}</Link><Link className="footer-link" href="/marketplace#categories">{t("nav.categories")}</Link><Link className="footer-link" href="/concepts/new">{t("nav.conceptLab")}</Link></div>
        <div><h3>Developers</h3><Link className="footer-link" href="/marketplace?type=API">Documentation</Link><Link className="footer-link" href="/manifesto">Manifesto</Link><Link className="footer-link" href="/concepts/new">Submit a concept</Link></div>
        <div><h3>Demo</h3><p className="footer-link">{t("footer.demo")}</p><Link className="footer-link" href="/settings">{t("settings.title")}</Link></div>
      </div>
      <div className="container footer-bottom"><span>MINI MARKET © 2026</span><span>Prototype · No real payments · No secrets collected</span></div>
    </footer>
  );
}
