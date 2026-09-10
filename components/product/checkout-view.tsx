"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, CreditCard } from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { formatCredits } from "@/lib/format";

export function CheckoutView() {
  const { cartProductIds, products, credits, purchase, hydrated } = useMarketplace();
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState("");
  const cartProducts = cartProductIds.map((id) => products.find((product) => product.id === id)).filter((product) => product !== undefined);
  const total = cartProducts.reduce((sum, product) => sum + product.demoPrice, 0);
  if (!hydrated) return <div className="skeleton" style={{ height: 420 }} />;
  if (complete) return <div className="empty-state"><div><CheckCircle2 size={42} color="var(--success)" /><div className="eyebrow" style={{ marginTop: 18 }}>PURCHASE COMPLETE</div><h2>Your developer library has been updated.</h2><p>Demo credits were deducted and the selected capabilities were added locally.</p><div style={{ display: "flex", justifyContent: "center", gap: 9 }}><Link className="button button-primary" href="/library">View library</Link><Link className="button" href="/marketplace">Keep exploring</Link></div></div></div>;
  if (!cartProducts.length) return <div className="empty-state"><div><h2>There is nothing to review.</h2><p>Add NOW capabilities to your cart before simulating a purchase.</p><Link className="button button-primary" href="/marketplace">Explore marketplace</Link></div></div>;
  const confirm = () => { const result = purchase(); setMessage(result.message); if (result.ok) setComplete(true); };
  return <div className="cart-layout">
    <section className="card" style={{ padding: 26 }}><div className="eyebrow">Review order</div><h2 className="section-title" style={{ marginTop: 14, fontSize: 38 }}>Simulated checkout</h2><div style={{ marginTop: 28 }}>{cartProducts.map((product) => <div className="cart-row" key={product.id}><span className="product-icon">{product.icon.slice(0, 2).toUpperCase()}</span><div><strong>{product.name}</strong><p className="muted" style={{ fontSize: 11, marginTop: 4 }}>{product.provider}</p></div><span className="mono" style={{ fontSize: 12 }}>{formatCredits(product.demoPrice)} credits</span><span /></div>)}</div></section>
    <aside className="card cart-summary"><CreditCard size={22} /><h3 style={{ marginTop: 16, fontSize: 20 }}>Confirm demo purchase</h3><div style={{ marginTop: 20 }}><div className="order-line"><span>Total</span><span>{formatCredits(total)} Credits</span></div><div className="order-line"><span>Current balance</span><span>{formatCredits(credits)} Credits</span></div><div className="order-line"><span>After purchase</span><span>{formatCredits(credits - total)} Credits</span></div></div>{message && !complete && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 12 }}>{message}</p>}<button className="button button-primary button-lg" type="button" onClick={confirm} style={{ width: "100%", marginTop: 18 }}>Confirm demo purchase <ArrowRight size={14} /></button><p className="form-hint" style={{ marginTop: 12 }}>No payment method, financial credential, or real transaction is involved.</p></aside>
  </div>;
}
