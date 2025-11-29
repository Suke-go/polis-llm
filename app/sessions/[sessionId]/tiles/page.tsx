"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { PhaseNav } from "../PhaseNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DashboardLink } from "@/components/DashboardLink";
import clsx from "clsx";

type Proposition = {
  id: string;
  jaText?: string;
  ja_text?: string;
};

type SessionInfo = {
  title: string;
  imageUrl: string | null;
};

export default function TilesPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
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
        setSessionInfo(data.session ?? null);
        setPropositions(data.propositions ?? []);
      } catch (e) {
        console.error(e);
        setError(
          e instanceof Error
            ? e.message
            : "命題の取得中にエラーが発生しました"
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
          selectedPropositionIds: Array.from(selectedIds),
        }),
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
    <main className="space-y-8 animate-drop-in">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main mb-2">
            Phase 2: 議論に参加する
          </h1>
          <p className="text-sm text-text-muted">
            Step 1: 投票対象の命題を選択
          </p>
        </div>
        <PhaseNav sessionId={sessionId} />
      </header>

      {/* Session Title & Image */}
      {sessionInfo && (
        <Card className="overflow-hidden p-0">
          <div className="grid md:grid-cols-2">
            <div className="aspect-video relative bg-slate-50">
              {sessionInfo.imageUrl ? (
                <Image
                  src={sessionInfo.imageUrl}
                  alt={sessionInfo.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted text-sm">
                  画像がまだ生成されていません
                </div>
              )}
            </div>
            <div className="p-8 flex flex-col justify-center bg-white/50 backdrop-blur-sm">
              <h1 className="text-3xl font-bold text-text-main mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                {sessionInfo.title}
              </h1>
              <p className="text-text-sub text-sm leading-relaxed">
                APS 承認済みの命題から、投票に回したいものを選んでください。
                選ばれた命題は、次のステップで参加者全員による投票にかけられます。
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-main">投票対象の命題を選択</h2>
        <div className="flex gap-2">
          <DashboardLink />
          <Button
            variant="primary"
            onClick={() => router.push(`/sessions/${sessionId}/vote`)}
          >
            投票画面へ移動 →
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded border border-emerald-500/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
          {success}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-text-muted">読み込み中...</p>
      ) : propositions.length === 0 ? (
        <p className="text-sm text-text-muted">
          このセッションには、APS 承認済みの命題がまだありません。
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {propositions.map((p) => {
              const checked = selectedIds.has(p.id);
              // Short preview - ensure jaText is always a string
              const jaText = (p.jaText ?? p.ja_text ?? "").toString();
              const preview =
                jaText.length > 80
                  ? `${jaText.slice(0, 80)}...`
                  : jaText;
              return (
                <div
                  key={p.id}
                  onClick={() => toggleSelect(p.id)}
                  className={clsx(
                    "cursor-pointer rounded-xl border p-5 transition-all duration-200 shadow-sm hover:shadow-md relative group",
                    checked
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-slate-200 bg-white hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <div
                        className={clsx(
                          "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                          checked
                            ? "border-primary bg-primary text-white"
                            : "border-slate-300 bg-white group-hover:border-primary/50"
                        )}
                      >
                        {checked && (
                          <svg
                            width="10"
                            height="8"
                            viewBox="0 0 10 8"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M1 4L3.5 6.5L9 1"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-muted mb-2 font-mono">
                        #{p.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-text-main leading-relaxed font-medium">
                        {preview}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end pt-6">
            <Button
              onClick={handleSubmit}
              disabled={submitting || selectedIds.size === 0}
              variant="primary"
              size="lg"
            >
              {submitting
                ? "登録中..."
                : `選択した ${selectedIds.size} 件を投票対象として登録`}
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
