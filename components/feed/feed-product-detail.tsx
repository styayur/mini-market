"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Rss } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { ProductActions } from "@/components/product/product-actions";
import { ProductIcon } from "@/components/product/product-icon";
import { TranslatableText } from "@/components/feed/translatable-text";
import { formatDate } from "@/lib/format";

export function FeedProductDetail() {
  const params = useSearchParams();
  const slug = params?.get("slug") ?? "";
  const { products, hydrated } = useMarketplace();
  const { language, t } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  if (!hydrated) return <div className="skeleton" style={{ height: 520 }} />;
  const product = products.find((item) => item.slug === slug);
  if (!product) {
    return <div className="container page-section empty-state"><div><Rss size={34} /><h1>{c("This feed item is not available.", "该订阅内容不可用。")}</h1><p>{c("Re-add or refresh its subscription to recover the item locally.", "请重新添加或刷新订阅源，以在本地恢复该条目。")}</p><Link className="button button-primary" href="/feeds">{t("nav.feeds")}</Link></div></div>;
  }
  const origin = product.origin.kind === "RSS" ? product.origin : undefined;
  return (
    <div className="container feed-detail-page">
      <div className="eyebrow" style={{ paddingTop: 32 }}><Link href="/marketplace">{c("Marketplace", "市场")}</Link> / <Link href="/feeds">{t("nav.feeds")}</Link> / {product.type}</div>
      <section className="detail-hero">
        <ProductIcon name={product.icon} large size={34} />
        <div>
          <div className="feed-detail-badges"><span className="badge badge-warning"><Rss size={11} /> {t("product.rssOrigin")}</span><span className="badge">{product.type}</span><span className="badge">{product.provider}</span></div>
          <TranslatableText as="h1" text={product.name} sourceLanguage={origin?.sourceLanguage} className="page-title" />
          <div style={{ marginTop: 22 }}><TranslatableText text={product.tagline} sourceLanguage={origin?.sourceLanguage} className="lead" /></div>
          <ProductActions product={product} />
        </div>
      </section>
      <div className="detail-layout">
        <div>
          <section className="copy-block"><h2>{c("Source description", "来源描述")}</h2><TranslatableText text={product.description} sourceLanguage={origin?.sourceLanguage} /></section>
          <section className="copy-block" style={{ marginTop: 46 }}><h2>{c("Tags", "标签")}</h2><div className="tag-cloud">{product.tags.map((tag) => <span className="chip" key={tag}>{tag}</span>)}</div></section>
          <p className="form-hint">{t("feeds.translationNotice")}</p>
        </div>
        <aside className="meta-panel">
          <div className="eyebrow">{c("Source record", "来源记录")}</div>
          <dl>
            <div className="meta-row"><dt>{c("Feed", "订阅源")}</dt><dd>{origin?.feedTitle ?? product.provider}</dd></div>
            {origin?.author && <div className="meta-row"><dt>{c("Author", "作者")}</dt><dd>{origin.author}</dd></div>}
            {origin?.publishedAt && <div className="meta-row"><dt>{c("Published", "发布时间")}</dt><dd>{formatDate(origin.publishedAt, language)}</dd></div>}
            <div className="meta-row"><dt>{c("Fetched", "抓取时间")}</dt><dd>{origin ? formatDate(origin.fetchedAt, language) : "—"}</dd></div>
            <div className="meta-row"><dt>{c("Language", "语言")}</dt><dd>{origin?.sourceLanguage ?? "—"}</dd></div>
          </dl>
          {origin?.originalUrl && <a className="button button-sm" style={{ width: "100%", marginTop: 16 }} href={origin.originalUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} /> {t("feeds.viewOriginal")}</a>}
          <p className="form-hint">{c("This item remains attributed to its publisher. A simulated pass does not grant access to the original content beyond what the publisher offers publicly.", "该内容仍归属于原发布者。模拟通行证不会提供发布者公开访问之外的额外权限。")}</p>
        </aside>
      </div>
      <Link className="button button-sm" href="/marketplace"><ArrowLeft size={13} /> {c("Back to marketplace", "返回市场")}</Link>
    </div>
  );
}
