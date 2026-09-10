import type { Metadata } from "next";
import { CheckoutView } from "@/components/product/checkout-view";
export const metadata: Metadata = { title: "Checkout", description: "Simulated checkout with fictional credits." };
export default function CheckoutPage() { return <div className="container page-section"><div className="eyebrow" style={{ marginBottom: 18 }}>Demo-only checkout</div><h1 className="page-title">Checkout</h1><p className="lead" style={{ maxWidth: 680, marginTop: 20, marginBottom: 48 }}>Review the simulated order. No real payment processing, financial credentials, or ownership transfer occurs.</p><CheckoutView /></div>; }
