import type { Metadata } from "next";
import { FavoritesView } from "@/components/product/favorites-view";
export const metadata: Metadata = { title: "Favorites", description: "Saved capabilities and future concepts." };
export default function FavoritesPage() { return <div className="container page-section"><div className="eyebrow" style={{ marginBottom: 18 }}>Saved items</div><h1 className="page-title">Favorites</h1><p className="lead" style={{ maxWidth: 630, marginTop: 20, marginBottom: 48 }}>A personal shelf of software, protocols, and speculative ideas.</p><FavoritesView /></div>; }
