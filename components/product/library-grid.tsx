"use client";

import Link from "next/link";
import { ExternalLink, Library, Trash2 } from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { ProductIcon } from "@/components/product/product-icon";
import { formatDate } from "@/lib/format";

export function LibraryGrid() {
  const { libraryProductIds, products, transactions, removeFromLibrary, hydrated } = useMarketplace();
  const library = libraryProductIds.map((id) => products.find((product) => product.id === id)).filter((product) => product !== undefined);
  if (!hydrated) return <div className="skeleton" style={{ height: 420 }} />;
  if (!library.length) return <div className="empty-state"><div><div className="product-icon" style={{ margin: "0 auto" }}><Library size={21} /></div><h2>Nothing here yet.</h2><p>Acquire a capability to start building your library.</p><Link className="button button-primary" href="/marketplace">Explore marketplace</Link></div></div>;
  return <div className="table-list">{library.map((product) => {
    const transaction = transactions.find((item) => item.productId === product.id);
    return <div className="table-row" key={product.id}><ProductIcon name={product.icon} /><div><strong><Link href={`/marketplace/${product.slug}`}>{product.name}</Link></strong><p className="muted mono" style={{ fontSize: 10, marginTop: 5 }}>{product.version ?? "Current"} · {product.provider}</p></div><span className="badge badge-live">ACCESS ACTIVE</span><span className="muted mono" style={{ fontSize: 10 }}>{transaction ? formatDate(transaction.createdAt) : "Demo library"}</span><div className="table-actions">{product.documentationUrl && <a className="icon-button" href={product.documentationUrl} target="_blank" rel="noreferrer" aria-label={`Open ${product.name} docs`}><ExternalLink size={15} /></a>}<button className="icon-button" type="button" onClick={() => removeFromLibrary(product.id)} aria-label={`Remove ${product.name}`}><Trash2 size={15} /></button></div></div>;
  })}</div>;
}
