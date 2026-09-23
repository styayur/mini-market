"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ExternalLink,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { FavoriteButton } from "@/components/product/favorite-button";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { formatCredits } from "@/lib/format";
import type { Product } from "@/types/marketplace";
export function ProductActions({ product }: { product: Product }) {
  const { addToCart, cartProductIds, libraryProductIds, hydrated } =
    useMarketplace();
  const { language } = useLanguage();
  const router = useRouter();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const inCart = cartProductIds.includes(product.id);
  return (
    <div className="detail-purchase">
      <div className="detail-token-price">
        ◈ {formatCredits(product.demoPrice)}{" "}
        <small>Token / {c("demo pass", "体验通行证")}</small>
      </div>
      <div className="detail-actions">
        <button
          className="button button-primary button-lg"
          disabled={!hydrated || inCart}
          onClick={() => addToCart(product.id)}
        >
          {inCart ? <Check size={15} /> : <Plus size={15} />}
          {inCart
            ? c("In your bag", "已在购物袋")
            : c("Add to bag", "加入购物袋")}
        </button>
        <button
          className="button button-lg"
          disabled={!hydrated}
          onClick={() => {
            if (!inCart) addToCart(product.id);
            router.push("/checkout");
          }}
        >
          {c("Checkout bag", "结算购物袋")}
          <ArrowRight size={15} />
        </button>
        <FavoriteButton productId={product.id} />
        <Link className="button button-lg" href="/cart">
          <ShoppingBag size={14} />
          {c("View bag", "查看购物袋")}
        </Link>
      </div>
      <p className="detail-demo-note">
        {c(
          "Collect a demo pass. Real API usage and provider access are purchased separately.",
          "收藏一张体验通行证。真实 API 用量与服务访问权限需向提供商另外购买。",
        )}
      </p>
      {libraryProductIds.includes(product.id) && (
        <Link className="collection-owned" href="/library">
          <Check size={13} />
          {c(
            "Already in your collection · collect more passes",
            "已收入收藏库，可继续收集通行证",
          )}
        </Link>
      )}
      {product.documentationUrl && (
        <a
          className="official-link"
          href={product.documentationUrl}
          target="_blank"
          rel="noreferrer"
        >
          {c("Official provider documentation", "提供商官方文档")}{" "}
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}
