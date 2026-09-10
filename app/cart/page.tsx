import type { Metadata } from "next";
import { CartView } from "@/components/product/cart-view";
export const metadata: Metadata = { title: "Cart", description: "Simulated cart for real developer capabilities." };
export default function CartPage() { return <div className="container page-section"><div className="eyebrow" style={{ marginBottom: 18 }}>Demo commerce</div><h1 className="page-title">Cart</h1><p className="lead" style={{ maxWidth: 660, marginTop: 20, marginBottom: 48 }}>Only NOW products behave like commerce items. FUTURE concepts can be watched, collected, or backed instead.</p><CartView /></div>; }
