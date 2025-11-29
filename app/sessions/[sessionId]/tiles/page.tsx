"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type Proposition = {
  id: string;
  jaText: string;
};

export default function TilesPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [propositions, setPropositions] = useState<Proposition[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/propositions?sessionId=${sessionId}`);
        if (!res.ok) {
          throw new Error("命題の取得に失敗しました");
        }
        const data = await res.json();
        setPropositions(data.propositions ?? []);
      } catch (e) {
        console.error(e);
        setError(
          e instanceof Error ? e.message : "命題の取得中にエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    }
    if (sessionId) {
      load();
    }
  }, [sessionId]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      setError("少なくとも1つの命題を選択してください。");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/statements/from-propositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          selectedPropositionIds: Array.from(selectedIds)
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "投票対象登録に失敗しました");
      }
      setSuccess("投票対象として登録しました。投票画面に移動します。");
      router.push(`/sessions/${sessionId}/vote`);
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "登録処理中にエラーが発生しました"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">命題タイル選択</h2>
        <button
          type="button"
          onClick={() => router.push(`/sessions/${sessionId}/vote`)}
          className="text-sm text-sky-400 hover:underline"
        >
          投票画面へ移動
        </button>
      </div>
      <p className="text-sm text-slate-300">
        APS 承認済みの命題から、投票に回したいものを選んでください。
      </p>
      {error && (
        <p className="rounded border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {success}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-slate-300">読み込み中...</p>
      ) : propositions.length === 0 ? (
        <p className="text-sm text-slate-400">
          このセッションには、APS 承認済みの命題がまだありません。
        </p>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {propositions.map((p) => {
              const checked = selectedIds.has(p.id);
              return (
                <label
                  key={p.id}
                  className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-3 text-sm transition ${
                    checked
                      ? "border-sky-400 bg-sky-950/40"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelect(p.id)}
                      className="mt-1 h-4 w-4 accent-sky-500"
                    />
                    <div>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {p.jaText}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center rounded bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "登録中..." : "投票対象として登録"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}


