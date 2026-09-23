import type { Metadata } from "next";
import { CartView } from "@/components/product/cart-view";
export const metadata: Metadata = { title: "Shopping bag" };
export default function CartPage() {
  return (
    <div className="container commerce-page">
      <CartView />
    </div>
  );
}
