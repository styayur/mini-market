import type { Metadata } from "next";
import { SettingsPanel } from "@/components/dashboard/settings-panel";
export const metadata: Metadata = { title: "Settings", description: "Manage local Mini Market demo data." };
export default function SettingsPage() { return <div className="container page-section"><div className="eyebrow" style={{ marginBottom: 18 }}>Demo controls</div><h1 className="page-title">Settings</h1><p className="lead" style={{ maxWidth: 650, marginTop: 20, marginBottom: 48 }}>Mini Market is a prototype. All commerce, credits, backing, and ownership states are local and simulated.</p><SettingsPanel /></div>; }
