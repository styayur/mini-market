import type { Metadata } from "next";
import { SettingsPanel } from "@/components/dashboard/settings-panel";
export const metadata: Metadata = { title: "Settings", description: "Configure the Fitimart virtual economy, translation, language, and local data." };
export default function SettingsPage() { return <div className="container page-section"><div className="eyebrow" style={{ marginBottom: 18 }}>Fitimart controls</div><h1 className="page-title">Settings</h1><p className="lead" style={{ maxWidth: 700, marginTop: 20, marginBottom: 48 }}>Fitimart is a static, local-first simulation. Configure exact virtual money, localization, translation, and portable marketplace data without implying real payments or currency conversion.</p><SettingsPanel /></div>; }
