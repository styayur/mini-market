import type { Metadata } from "next";
import { CheckoutView } from "@/components/product/checkout-view";
export const metadata: Metadata = { title: "Checkout" };
export default function CheckoutPage() {
  return (
    <div className="container commerce-page">
      <CheckoutView />
    </div>
  );
}
