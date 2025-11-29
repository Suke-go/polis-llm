import "./globals.css";
import type { ReactNode } from "react";
import { Inter, Noto_Sans_JP } from "next/font/google";
import { BackgroundShapes } from "@/components/ui/BackgroundShapes";
import { DashboardLink } from "@/components/DashboardLink";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata = {
  title: "Commons Ground",
  description: "未来社会の実験場 - SFプロトタイピング × APS × Polis プロトタイプ",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="min-h-screen bg-background text-text-main font-sans selection:bg-primary/20">
        <BackgroundShapes />
        
        <div className="mx-auto max-w-6xl px-6 py-8 relative z-10">
          <header className="mb-12 flex items-center justify-between border-b border-slate-100 pb-6 backdrop-blur-sm">
            <div>
              <Link href="/">
                <h1 className="text-3xl font-bold tracking-tight text-text-main font-sans bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent hover:opacity-80 transition-opacity cursor-pointer">
                  Commons Ground
                </h1>
              </Link>
              <p className="mt-2 text-sm text-text-sub font-jp">
                未来社会の実験場
              </p>
            </div>
            <div className="flex items-center gap-4">
              <DashboardLink />
              {/* Minimalist decoration for header */}
              <div className="hidden md:block w-12 h-12 rounded-full border border-slate-200 opacity-50"></div>
            </div>
          </header>
          <main className="animate-drop-in">
            {children}
          </main>
          
          <footer className="mt-20 pt-8 border-t border-slate-100 text-center text-xs text-text-muted">
            <p>© 2050 Academic Futurism Design. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
