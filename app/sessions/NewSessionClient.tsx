"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function NewSessionClient() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title || !prompt) {
      setError("タイトルとプロンプトを入力してください。");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, prompt }),
      });
      if (!res.ok) {
        throw new Error("failed");
      }
      const json = (await res.json()) as { sessionId: string };
      router.push(`/sessions/${json.sessionId}`);
    } catch {
      setError("セッション作成に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-sub mb-1.5">
          セッションタイトル
        </label>
        <input
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-text-muted"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 自動運転レーンと商店街の未来"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-sub mb-1.5">
          プロンプト
        </label>
        <textarea
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-text-muted resize-none"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="都市・テーマ・Society 5.0 観点などを自由に記述してください。"
        />
      </div>
      {error && <p className="text-sm text-accent">{error}</p>}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={loading}
          variant="primary"
          className="w-full"
        >
          {loading ? "作成中..." : "セッションを作成"}
        </Button>
      </div>
    </form>
  );
}
