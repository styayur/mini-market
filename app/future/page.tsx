import type { Metadata } from "next";
import { FutureMarket } from "@/components/marketplace/future-market";
export const metadata: Metadata = {
  title: "Future Market",
  description: "Discover and back speculative AI concepts with demo Tokens.",
};
export default function FuturePage() {
  return (
    <div className="container commerce-page">
      <FutureMarket />
    </div>
  );
}
