import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { LanguageProvider } from "@/components/providers/language-provider";
import { MarketplaceProvider } from "@/components/providers/marketplace-provider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Mini Market — The Marketplace for AI Capabilities", template: "%s · Mini Market" },
  description: "Discover APIs, tools, extensions and speculative technologies. Buy what exists. Imagine what comes next.",
  applicationName: "Mini Market",
  keywords: ["AI marketplace", "APIs", "MCP", "agents", "developer tools", "future concepts"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body suppressHydrationWarning>
        <LanguageProvider>
        <MarketplaceProvider>
          <div className="site-shell">
            <a href="#main-content" className="button button-primary" style={{ position: "fixed", left: 16, top: -80, zIndex: 200 }}>Skip to content</a>
            <Navbar />
            <main id="main-content" className="page-main">{children}</main>
            <Footer />
          </div>
        </MarketplaceProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}


