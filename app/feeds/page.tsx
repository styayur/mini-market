import type { Metadata } from "next";
import { FeedManager } from "@/components/feed/feed-manager";

export const metadata: Metadata = {
  title: "Feeds",
  description: "Subscribe to public RSS 2.0, Atom, and JSON Feeds and import entries into Fitimart.",
};

export default function FeedsPage() {
  return <div className="container commerce-page feed-page"><FeedManager /></div>;
}
