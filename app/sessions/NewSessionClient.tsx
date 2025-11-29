"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        body: JSON.stringify({ title, prompt })
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          セッションタイトル
        </label>
        <input
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 自動運転レーンと商店街の未来"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          プロンプト
        </label>
        <textarea
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="都市・テーマ・Society 5.0 観点などを自由に記述してください。"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center rounded-full bg-sky-500 px-4 py-1.5 text-xs font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
      >
        {loading ? "作成中..." : "セッションを作成"}
      </button>
    </form>
  );
}


