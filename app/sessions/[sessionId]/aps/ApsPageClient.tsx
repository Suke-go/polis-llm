"use client";

import { useState } from "react";
import type { Proposition } from "@prisma/client";
import { PrevNextNav } from "../StepNav";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import clsx from "clsx";

interface ApsPageClientProps {
  sessionId: string;
  initialPropositions: Proposition[];
}

type StepStatus = "not_started" | "generated" | "approved";

export default function ApsPageClient({
  sessionId,
  initialPropositions,
}: ApsPageClientProps) {
  const [propsState, setPropsState] =
    useState<Proposition[]>(initialPropositions);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apsApproved = propsState.some((p) => p.status_aps_approved);
  const hasApsResults = propsState.some(
    (p) => p.en_text || p.back_translated_ja
  );
  const status: StepStatus = !hasApsResults
    ? "not_started"
    : apsApproved
    ? "approved"
    : "generated";

  async function callApi(url: string, body: any): Promise<any | null> {
    setError(null);
    setLoading(url);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "API error");
      }
      return await res.json();
    } catch (e: any) {
      setError(e.message ?? "API error");
      return null;
    } finally {
      setLoading(null);
    }
  }

  async function handleRunAps() {
    const json = await callApi("/api/propositions/aps", {
      sessionId,
    });
    if (json?.propositions) {
      setPropsState(json.propositions);
    }
  }

  async function handleApproveAps() {
    const json = await callApi("/api/propositions/approve-aps", {
      sessionId,
    });
    if (json?.propositions) {
      setPropsState(json.propositions);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-main">
            翻訳・APS・再翻訳の実行と承認
          </h2>
          <StatusBadge status={status} />
        </div>
        <p className="text-sm text-text-sub mb-6">
          日本語命題を英訳し、Gemma-APS で命題分割 → 再翻訳して確認・承認します。
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            onClick={handleRunAps}
            disabled={loading === "/api/propositions/aps"}
            variant="primary"
            size="sm"
          >
            {loading === "/api/propositions/aps"
              ? "実行中..."
              : "翻訳・APS・再翻訳を実行"}
          </Button>
          <Button
            onClick={handleApproveAps}
            disabled={
              propsState.length === 0 ||
              loading === "/api/propositions/approve-aps"
            }
            variant="secondary"
            size="sm"
          >
            {apsApproved ? "APS結果を再承認" : "APS結果を承認"}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-h-[600px] overflow-auto pr-2 custom-scrollbar">
          {propsState.length === 0 ? (
            <p className="text-sm text-text-muted col-span-3 text-center py-8">
              まだ APS 結果がありません（先に命題生成と承認を行ってください）。
            </p>
          ) : (
            propsState.map((p, idx) => (
              <div
                key={p.id}
                className="rounded-lg border border-slate-200 bg-surface p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted">
                    命題 #{idx + 1}
                  </span>
                  <span
                    className={clsx(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full",
                      p.status_aps_approved
                        ? "bg-secondary/20 text-text-main"
                        : "bg-slate-100 text-text-muted"
                    )}
                  >
                    {p.status_aps_approved ? "APS承認済" : "APS未承認"}
                  </span>
                </div>
                
                <div>
                  <p className="text-xs font-bold text-text-main mb-1">
                    日本語
                  </p>
                  <p className="rounded-md border border-slate-100 bg-white px-3 py-2 text-xs text-text-sub shadow-sm">
                    {p.ja_text}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-text-main mb-1">
                    英文命題
                  </p>
                  <p className="rounded-md border border-slate-100 bg-white px-3 py-2 text-xs text-text-sub min-h-[3rem] shadow-sm">
                    {p.en_text ?? (
                      <span className="text-text-muted italic">なし</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-main mb-1">
                    再翻訳（日本語）
                  </p>
                  <p className="rounded-md border border-slate-100 bg-white px-3 py-2 text-xs text-text-sub min-h-[3rem] shadow-sm">
                    {p.back_translated_ja ?? (
                      <span className="text-text-muted italic">なし</span>
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <PrevNextNav sessionId={sessionId} current="aps" />

      {/* フェーズ2・フェーズ3へのナビゲーション */}
      {apsApproved && (
        <Card className="mt-8 border-primary/20 bg-primary/5">
          <h2 className="text-lg font-bold text-primary mb-2">
            フェーズ1が完了しました！次のフェーズへ
          </h2>
          <p className="text-sm text-text-sub mb-4">
            課題設定が完了したら、フェーズ2（議論に参加する）とフェーズ3（議論の内容を分析する）に進めます。
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={`/sessions/${sessionId}/tiles`}>
              <Button variant="primary">
                Phase 2: 議論に参加する（命題選択） →
              </Button>
            </Link>
            <Link href={`/sessions/${sessionId}/vote`}>
              <Button variant="outline">
                Phase 2: 議論に参加する（投票） →
              </Button>
            </Link>
            <Link href={`/sessions/${sessionId}/results`}>
              <Button variant="ghost">
                Phase 3: 議論の内容を分析する →
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: StepStatus }) {
  const label =
    status === "not_started"
      ? "未実行"
      : status === "generated"
      ? "実行済み"
      : "承認済み";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "not_started"
          ? "bg-slate-100 text-text-muted"
          : status === "generated"
          ? "bg-secondary/20 text-text-main"
          : "bg-primary/20 text-primary"
      )}
    >
      {label}
    </span>
  );
}
