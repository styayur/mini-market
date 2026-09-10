import type { Metadata } from "next";
import { LibraryGrid } from "@/components/product/library-grid";
export const metadata: Metadata = { title: "Library", description: "Developer capabilities in your local demo library." };
export default function LibraryPage() { return <div className="container page-section"><div className="eyebrow" style={{ marginBottom: 18 }}>Your collection</div><h1 className="page-title">Library</h1><p className="lead" style={{ maxWidth: 670, marginTop: 20, marginBottom: 48 }}>Capabilities you acquired in the simulated marketplace. Access is local to this browser and does not grant real provider credentials.</p><LibraryGrid /></div>; }
