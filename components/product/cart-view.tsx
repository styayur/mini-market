"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { ProductIcon } from "@/components/product/product-icon";
import { formatCredits } from "@/lib/format";

export function CartView() {
  const { cartProductIds, products, removeFromCart, credits, hydrated } = useMarketplace();
  const cartProducts = cartProductIds.map((id) => products.find((product) => product.id === id)).filter((product) => product !== undefined);
  const total = cartProducts.reduce((sum, product) => sum + product.demoPrice, 0);
  if (!hydrated) return <div className="skeleton" style={{ height: 420 }} />;
  if (!cartProducts.length) return <div className="empty-state"><div><div className="product-icon" style={{ margin: "0 auto" }}><ShoppingBag size={21} /></div><h2>Your cart is empty.</h2><p>Explore capabilities worth bringing home.</p><Link className="button button-primary" href="/marketplace">Explore marketplace</Link></div></div>;
  return <div className="cart-layout">
    <section className="card" style={{ padding: "0 22px" }}>
      {cartProducts.map((product) => <div className="cart-row" key={product.id}><ProductIcon name={product.icon} /><div><h3 style={{ fontWeight: 650 }}><Link href={`/marketplace/${product.slug}`}>{product.name}</Link></h3><p className="muted mono" style={{ marginTop: 5, fontSize: 10 }}>{product.type} · {product.provider}</p></div><span className="mono" style={{ fontSize: 12 }}>{formatCredits(product.demoPrice)} credits</span><button className="icon-button" type="button" onClick={() => removeFromCart(product.id)} aria-label={`Remove ${product.name}`}><Trash2 size={15} /></button></div>)}
    </section>
    <aside className="card cart-summary">
      <div className="eyebrow">Order summary</div>
      <div style={{ marginTop: 22 }}>{cartProducts.map((product) => <div className="order-line" key={product.id}><span>{product.name}</span><span>{formatCredits(product.demoPrice)} cr</span></div>)}</div>
      <div className="divider" style={{ marginBlock: 16 }} /><div className="order-line" style={{ color: "var(--foreground)", fontWeight: 650 }}><span>Subtotal</span><span>{formatCredits(total)} credits</span></div><div className="order-line"><span>Demo balance</span><span>{formatCredits(credits)}</span></div>
      <Link className="button button-primary button-lg" href="/checkout" style={{ width: "100%", marginTop: 18 }}>Simulate purchase <ArrowRight size={14} /></Link>
      <p className="form-hint" style={{ marginTop: 12 }}>Credits are demo-only and have no real-world monetary value.</p>
    </aside>
  </div>;
}
