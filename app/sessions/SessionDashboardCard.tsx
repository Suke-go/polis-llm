"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import clsx from "clsx";

type Session = {
  id: string;
  title: string;
  createdAt: Date;
  apsApprovedCount: number;
  hasStatements: boolean;
  hasAnalysis: boolean;
  propositions?: Array<{ id: string; ja_text: string }>;
  imageUrl?: string | null;
};

type Phase = "setup" | "discuss" | "analyze" | "all";

interface SessionDashboardCardProps {
  session: Session;
  phase: Phase;
}

export default function SessionDashboardCard({
  session,
  phase,
}: SessionDashboardCardProps) {
  const canVote = session.apsApprovedCount > 0;
  const canAnalyze = session.hasAnalysis;
  const showPropositions = (phase === "discuss" || phase === "analyze") && session.propositions && session.propositions.length > 0;

  return (
    <div
      className={clsx(
        "rounded-xl border overflow-hidden transition-all duration-300 shadow-sm",
        phase === "all"
          ? "border-slate-200 bg-white hover:border-primary/40 hover:shadow-lg hover:-translate-y-1"
          : "border-slate-200 bg-white/90 hover:bg-white hover:shadow-md"
      )}
    >
      {/* 画像表示 */}
      {session.imageUrl && (
        <div className="relative w-full aspect-video bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
          <Image
            src={session.imageUrl}
            alt={session.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      )}
      
      <div className="p-4">
        <div className="mb-3">
          <h4 className="font-bold text-text-main text-sm mb-1.5 line-clamp-2 leading-snug">
            {session.title}
          </h4>
          <p className="text-xs text-text-muted font-medium">
            {session.createdAt.toLocaleString("ja-JP", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

      {/* 命題プレビュー（Phase 2, 3の場合） */}
      {showPropositions && (
        <div className="mb-3 space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
          {session.propositions!.slice(0, 3).map((prop) => (
            <div
              key={prop.id}
              className="text-xs text-text-sub line-clamp-2 px-2.5 py-1.5 rounded-md bg-gradient-to-r from-primary/5 to-transparent border-l-2 border-primary/30 hover:border-primary/50 transition-colors"
            >
              {prop.ja_text}
            </div>
          ))}
          {session.propositions!.length > 3 && (
            <p className="text-[10px] text-text-muted text-center font-medium">
              +{session.propositions!.length - 3}件の命題
            </p>
          )}
        </div>
      )}

      {/* ステータス表示 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {session.apsApprovedCount > 0 && (
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">
            {session.apsApprovedCount}件
          </span>
        )}
        {session.hasStatements && (
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold bg-accent/15 text-accent border border-accent/20">
            投票可能
          </span>
        )}
        {session.hasAnalysis && (
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold bg-secondary/15 text-text-main border border-secondary/20">
            分析済み
          </span>
        )}
      </div>

      {/* アクションボタン */}
      <div className="flex flex-wrap gap-2">
        {phase === "all" || phase === "setup" ? (
          <Link href={`/sessions/${session.id}/aps`} className="flex-1 min-w-[120px]">
            <Button variant="outline" size="sm" className="w-full text-xs">
              Phase 1: 承認
            </Button>
          </Link>
        ) : null}

        {phase === "all" || phase === "discuss" ? (
          canVote ? (
            <>
              <Link href={`/sessions/${session.id}/tiles`} className="flex-1 min-w-[100px]">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  命題を見る
                </Button>
              </Link>
              <Link href={`/sessions/${session.id}/vote`} className="flex-1 min-w-[100px]">
                <Button variant="primary" size="sm" className="w-full text-xs">
                  投票する
                </Button>
              </Link>
            </>
          ) : (
            <Link href={`/sessions/${session.id}/tiles`} className="flex-1 min-w-[120px]">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Phase 2: 命題選択
              </Button>
            </Link>
          )
        ) : null}

        {phase === "all" || phase === "analyze" ? (
          <>
            {canVote && (
              <Link href={`/sessions/${session.id}/tiles`} className="flex-1 min-w-[100px]">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  命題を見る
                </Button>
              </Link>
            )}
            {canAnalyze ? (
              <Link href={`/sessions/${session.id}/results`} className="flex-1 min-w-[100px]">
                <Button variant="secondary" size="sm" className="w-full text-xs">
                  結果を見る
                </Button>
              </Link>
            ) : canVote ? (
              <Link href={`/sessions/${session.id}/results`} className="flex-1 min-w-[100px]">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  分析する
                </Button>
              </Link>
            ) : null}
          </>
        ) : null}
      </div>
      </div>
    </div>
  );
}

