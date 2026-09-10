import { ProductCardSkeleton } from "@/components/ui/loading-state";

export default function Loading() {
  return <div className="container page-section"><div className="skeleton" style={{ width: 220, height: 34, marginBottom: 18 }} /><div className="skeleton" style={{ width: 540, maxWidth: "80%", height: 18, marginBottom: 40 }} /><div className="grid-products">{[1,2,3,4,5,6,7,8].map((item) => <ProductCardSkeleton key={item} />)}</div></div>;
}
