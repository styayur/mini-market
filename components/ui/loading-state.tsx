export function ProductCardSkeleton() {
  return (
    <div className="card product-card" aria-hidden="true">
      <div className="skeleton" style={{ width: 70, height: 22 }} />
      <div className="skeleton" style={{ width: 50, height: 50, marginTop: 20 }} />
      <div className="skeleton" style={{ width: "72%", height: 24, marginTop: 18 }} />
      <div className="skeleton" style={{ width: "45%", height: 12, marginTop: 8 }} />
      <div className="skeleton" style={{ width: "100%", height: 44, marginTop: 18 }} />
      <div className="skeleton" style={{ width: "100%", height: 1, marginTop: "auto" }} />
    </div>
  );
}
