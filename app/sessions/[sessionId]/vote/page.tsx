"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

type Statement = {
  id: string;
  textJa: string;
  currentVote?: number | null;
};

type VoteValue = 1 | 0 | -1;

const STORAGE_KEY_PREFIX = "polis-participant-";

function getStorageKey(sessionId: string) {
  return `${STORAGE_KEY_PREFIX}${sessionId}`;
}

export default function VotePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [participantId, setParticipantId] = useState<string | null>(null);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const loadStatements = useCallback(
    async (pid: string) => {
      setError(null);
      try {
        const res = await fetch(
          `/api/statements?sessionId=${sessionId}&participantId=${pid}`
        );
        if (!res.ok) {
          throw new Error("投票用命題の取得に失敗しました");
        }
        const data = await res.json();
        setStatements(
          (data.statements ?? []).map((s: any) => ({
            id: s.id,
            textJa: s.textJa,
            currentVote: s.currentVote ?? null
          }))
        );
      } catch (e) {
        console.error(e);
        setError(
          e instanceof Error
            ? e.message
            : "投票用命題の取得中にエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  useEffect(() => {
    async function init() {
      if (!sessionId) return;

      let pid: string | null = null;
      try {
        const key = getStorageKey(sessionId);
        if (typeof window !== "undefined") {
          pid = window.localStorage.getItem(key);
        }
      } catch {
        // ignore
      }

      if (!pid) {
        try {
          const res = await fetch("/api/participants/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId })
          });
          if (!res.ok) {
            throw new Error("参加者IDの作成に失敗しました");
          }
          const data = await res.json();
          pid = data.participantId;
          if (typeof window !== "undefined") {
            const key = getStorageKey(sessionId);
            window.localStorage.setItem(key, pid);
          }
        } catch (e) {
          console.error(e);
          setError(
            e instanceof Error
              ? e.message
              : "参加者登録中にエラーが発生しました"
          );
          setLoading(false);
          return;
        }
      }

      setParticipantId(pid);
      await loadStatements(pid);
    }

    init();
  }, [sessionId, loadStatements]);

  const handleVote = async (statementId: string, vote: VoteValue) => {
    if (!participantId) return;
    setSubmittingId(statementId);
    setError(null);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, statementId, vote })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "投票に失敗しました");
      }

      setStatements((prev) =>
        prev.map((s) =>
          s.id === statementId ? { ...s, currentVote: vote } : s
        )
      );
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "投票送信中にエラーが発生しました"
      );
    } finally {
      setSubmittingId(null);
    }
  };

  const renderVoteLabel = (v: VoteValue) => {
    if (v === 1) return "Yes";
    if (v === -1) return "No";
    return "Pass";
  };

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Polis 型投票</h2>
      </div>
      <p className="text-sm text-slate-300">
        各命題に対して、あなたの意見に最も近いボタンを選んでください。
        投票内容は匿名IDに紐づいて記録され、ページを閉じても保持されます。
      </p>
      {error && (
        <p className="rounded border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-slate-300">読み込み中...</p>
      ) : statements.length === 0 ? (
        <p className="text-sm text-slate-400">
          このセッションには、投票対象の命題がまだ登録されていません。
          先に命題タイル画面から選択してください。
        </p>
      ) : (
        <div className="space-y-3">
          {statements.map((s) => (
            <article
              key={s.id}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
            >
              <p className="text-sm leading-relaxed">{s.textJa}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {( [
                  [1, "bg-emerald-500 hover:bg-emerald-400"],
                  [-1, "bg-rose-500 hover:bg-rose-400"],
                  [0, "bg-slate-600 hover:bg-slate-500"]
                ] as const).map(([v, baseClass]) => {
                  const isActive = s.currentVote === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      disabled={submittingId === s.id}
                      onClick={() =>
                        handleVote(s.id, v as VoteValue)
                      }
                      className={`inline-flex items-center rounded px-3 py-1 text-xs font-medium transition ${
                        isActive
                          ? `${baseClass} text-slate-950`
                          : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {renderVoteLabel(v as VoteValue)}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}


