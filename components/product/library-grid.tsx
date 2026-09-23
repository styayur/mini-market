"use client";
import Link from "next/link";
import { ExternalLink, Library, ArrowUpRight } from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { ProductIcon } from "@/components/product/product-icon";
export function LibraryGrid() {
  const { libraryProductIds, products, transactions, hydrated } =
    useMarketplace();
  const { language } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const library = products.filter((p) => libraryProductIds.includes(p.id));
  return (
    <>
      <div className="commerce-heading">
        <span className="section-overline">
          {c("Collected, with curiosity", "把好奇心，变成收藏")}
        </span>
        <h1>{c("Your capability collection.", "你的能力收藏库。")}</h1>
        <p>
          {c(
            "A shelf of possibilities. Demo passes do not activate real provider services.",
            "每一份收藏，都是一种可能。体验通行证不会开通真实服务。",
          )}
        </p>
      </div>
      {!hydrated ? (
        <div className="skeleton" style={{ height: 300 }} />
      ) : !library.length ? (
        <div className="empty-state">
          <div>
            <Library size={32} />
            <h2>
              {c("Make room for your next idea.", "给下一个好点子，留个位置。")}
            </h2>
            <p>
              {c(
                "Your purchased capability passes will appear here.",
                "购买后的能力通行证会出现在这里。",
              )}
            </p>
            <Link className="button button-primary" href="/marketplace">
              {c("Start collecting", "开始收集")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="collection-grid">
          {library.map((p) => {
            const records = transactions.filter((t) => t.productId === p.id);
            const count = records.reduce((n, t) => n + t.quantity, 0);
            return (
              <article className="collected-pass" key={p.id}>
                <div className="card-topline">
                  <ProductIcon name={p.icon} large size={32} />
                  <span className="badge badge-live">
                    {c("Collected", "已收藏")}
                  </span>
                </div>
                <small>{p.provider}</small>
                <h2>{p.name}</h2>
                <p>{p.tagline}</p>
                <div className="pass-ownership">
                  <strong>× {count || 1}</strong>
                  <span>{c("demo passes", "张体验通行证")}</span>
                  <span>
                    {records[0]
                      ? new Date(records[0].createdAt).toLocaleDateString(
                          language === "zh" ? "zh-CN" : "en-US",
                        )
                      : "—"}
                  </span>
                </div>
                <div className="collected-actions">
                  <Link href={`/marketplace/${p.slug}`}>
                    {c("Explore capability", "了解能力")}{" "}
                    <ArrowUpRight size={14} />
                  </Link>
                  {p.documentationUrl && (
                    <a
                      href={p.documentationUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {c("Official docs", "官方文档")}
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
