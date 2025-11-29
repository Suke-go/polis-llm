"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PhaseNav } from "../PhaseNav";
import Link from "next/link";
import { DashboardLink } from "@/components/DashboardLink";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PolisVisualization } from "@/components/results/PolisVisualization";

type AnalysisResult = {
  statementId: string;
  textJa: string;
  agreeRate: number;
  disagreeRate: number;
  passRate: number;
  totalVotes: number;
};

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analysis/result?sessionId=${sessionId}`);
        if (!res.ok) {
          throw new Error("分析結果の取得に失敗しました");
        }
        const data = await res.json();
        setResults(data.results ?? []);
      } catch (e) {
        console.error(e);
        setError(
          e instanceof Error
            ? e.message
            : "分析結果の取得中にエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    }
    if (sessionId) {
      load();
    }
  }, [sessionId]);

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  return (
    <main className="space-y-8 animate-drop-in">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main mb-2">
            Phase 3: 議論の内容を分析する
          </h1>
          <p className="text-sm text-text-muted">投票結果の可視化と分析</p>
        </div>
        <PhaseNav sessionId={sessionId} />
      </header>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-main">投票結果の可視化</h2>
        <div className="flex gap-2">
          <DashboardLink />
          <Link href={`/sessions/${sessionId}/vote`}>
            <Button variant="ghost" size="sm">
              ← 投票画面へ戻る
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-text-sub">
          Polisスタイルの投票結果可視化。各命題の投票分布と、参加者間の意見類似度を確認できます。
        </p>
        
        {/* Polis-style visualization */}
        <PolisVisualization sessionId={sessionId} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-text-main mb-4">集計結果（従来形式）</h2>
        <p className="text-sm text-text-sub mb-4">
          各命題に対する投票結果を表示します。賛成率、反対率、Pass率を棒グラフで可視化しています。
        </p>

      {error && (
        <p className="rounded border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-text-muted">読み込み中...</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-text-muted">
          このセッションには、まだ投票結果がありません。
          先に投票を行ってください。
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {results.map((result) => (
            <Card
              key={result.statementId}
              className="flex flex-col justify-between"
            >
              <div>
                <p className="text-base font-medium text-text-main mb-6 leading-relaxed">
                  {result.textJa}
                </p>

                {/* 投票数表示 */}
                <div className="mb-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                  Total Votes: {result.totalVotes}
                </div>
              </div>

              {/* 棒グラフ */}
              <div className="space-y-4">
                {/* 賛成 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-600">
                      賛成 (Agree)
                    </span>
                    <span className="text-xs font-bold text-text-main">
                      {formatPercentage(result.agreeRate)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                      style={{ width: `${result.agreeRate * 100}%` }}
                    />
                  </div>
                </div>

                {/* 反対 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-rose-600">
                      反対 (Disagree)
                    </span>
                    <span className="text-xs font-bold text-text-main">
                      {formatPercentage(result.disagreeRate)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-1000 ease-out"
                      style={{ width: `${result.disagreeRate * 100}%` }}
                    />
                  </div>
                </div>

                {/* Pass */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-500">
                      Pass
                    </span>
                    <span className="text-xs font-bold text-text-main">
                      {formatPercentage(result.passRate)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-400 transition-all duration-1000 ease-out"
                      style={{ width: `${result.passRate * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>
    </main>
  );
}
