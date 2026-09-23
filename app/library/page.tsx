import type { Metadata } from "next";
import { LibraryGrid } from "@/components/product/library-grid";
export const metadata: Metadata = { title: "My collection" };
export default function LibraryPage() {
  return (
    <div className="container commerce-page">
      <LibraryGrid />
    </div>
  );
}
