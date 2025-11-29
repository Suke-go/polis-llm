import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "SF Prototyping Polis",
  description: "SFプロトタイピング × APS × Polis プロトタイプ"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <header className="mb-6 border-b border-slate-800 pb-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              SF Prototyping Polis
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              タイル表示 → 命題選択 → Polis 型投票フロー
            </p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}


