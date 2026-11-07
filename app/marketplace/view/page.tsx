import type { Metadata } from "next";
import { Suspense } from "react";
import { FeedProductDetail } from "@/components/feed/feed-product-detail";

export const metadata: Metadata = {
  title: "Subscribed item",
  description: "A validated RSS, Atom, or JSON Feed item imported into Fitimart.",
};

export default function FeedProductPage() {
  return <Suspense fallback={<div className="skeleton" style={{ height: 520 }} />}><FeedProductDetail /></Suspense>;
}
