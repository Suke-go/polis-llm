"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PhaseNav } from "../PhaseNav";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DashboardLink } from "@/components/DashboardLink";
import clsx from "clsx";

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
  const router = useRouter();
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
            currentVote: s.currentVote ?? null,
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
            body: JSON.stringify({ sessionId }),
          });
          if (!res.ok) {
            throw new Error("参加者IDの作成に失敗しました");
          }
          const data = await res.json();
          pid = data.participantId;
          if (typeof window !== "undefined" && pid) {
            const key = getStorageKey(sessionId);
            window.localStorage.setItem(key, pid);
          }
        } catch (e) {
          console.error(e);
          setError(
            e instanceof Error ? e.message : "参加者登録中にエラーが発生しました"
          );
          setLoading(false);
          return;
        }
      }

      if (!pid) {
        setError("参加者IDの取得に失敗しました");
        setLoading(false);
        return;
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
        body: JSON.stringify({ participantId, statementId, vote }),
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
    if (v === 1) return "賛成 (Yes)";
    if (v === -1) return "反対 (No)";
    return "パス (Pass)";
  };

  return (
    <main className="space-y-8 animate-drop-in">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main mb-2">
            Phase 2: 議論に参加する
          </h1>
          <p className="text-sm text-text-muted">Step 2: Polis 型投票</p>
        </div>
        <PhaseNav sessionId={sessionId} />
      </header>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-main">投票</h2>
        <div className="flex gap-2">
          <DashboardLink />
          <Link href={`/sessions/${sessionId}/results`}>
            <Button variant="ghost" size="sm" className="text-secondary hover:text-secondary/80">
              結果可視化へ →
            </Button>
          </Link>
        </div>
      </div>

      <p className="text-sm text-text-sub">
        各命題に対して、あなたの意見に最も近いボタンを選んでください。
        投票内容は匿名IDに紐づいて記録され、ページを閉じても保持されます。
      </p>

      {error && (
        <p className="rounded border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-text-muted">読み込み中...</p>
      ) : statements.length === 0 ? (
        <p className="text-sm text-text-muted">
          このセッションには、投票対象の命題がまだ登録されていません。
          先に命題タイル画面から選択してください。
        </p>
      ) : (
        <div className="space-y-4 max-w-3xl mx-auto">
          {statements.map((s) => (
            <Card key={s.id} className="p-6 transition-all hover:shadow-md">
              <p className="text-lg font-medium text-text-main leading-relaxed mb-6">
                {s.textJa}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {([
                  [1, "bg-emerald-500 hover:bg-emerald-600 text-white", "border-emerald-500 text-emerald-600 hover:bg-emerald-50"],
                  [-1, "bg-rose-500 hover:bg-rose-600 text-white", "border-rose-500 text-rose-600 hover:bg-rose-50"],
                  [0, "bg-slate-500 hover:bg-slate-600 text-white", "border-slate-400 text-slate-500 hover:bg-slate-100"],
                ] as const).map(([v, activeClass, inactiveClass]) => {
                  const isActive = s.currentVote === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      disabled={submittingId === s.id}
                      onClick={() => handleVote(s.id, v as VoteValue)}
                      className={clsx(
                        "flex-1 md:flex-none px-6 py-2.5 rounded-full text-sm font-bold transition-all border",
                        isActive
                          ? activeClass + " border-transparent shadow-md transform scale-105"
                          : inactiveClass,
                        "disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                    >
                      {renderVoteLabel(v as VoteValue)}
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
