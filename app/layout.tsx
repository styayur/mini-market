import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { LanguageProvider } from "@/components/providers/language-provider";
import { MarketplaceProvider } from "@/components/providers/marketplace-provider";
import "./globals.css";
import "./storefront.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mini Market — Collect Your Next Capability",
    template: "%s · Mini Market",
  },
  description:
    "Shop AI capability passes with demo Tokens. Discover real tools, collect new possibilities, and back ideas from the future.",
  applicationName: "Mini Market",
  keywords: [
    "AI marketplace",
    "APIs",
    "MCP",
    "agents",
    "developer tools",
    "future concepts",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body suppressHydrationWarning>
        <LanguageProvider>
          <MarketplaceProvider>
            <div className="site-shell">
              <a
                href="#main-content"
                className="button button-primary skip-link"
                style={{ position: "fixed", left: 16, top: -80, zIndex: 200 }}
              >
                Skip to content
              </a>
              <Navbar />
              <main id="main-content" className="page-main">
                {children}
              </main>
              <Footer />
            </div>
          </MarketplaceProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
