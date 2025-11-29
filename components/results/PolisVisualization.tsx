"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

type Participant = {
  id: string;
  createdAt: string;
};

type Statement = {
  id: string;
  textJa: string;
  textEn?: string;
};

type VotesMatrix = {
  participants: Participant[];
  statements: Statement[];
  matrix: (number | null)[][]; // [participantIndex][statementIndex] = vote (1, -1, 0, or null)
};

type Props = {
  sessionId: string;
};

export function PolisVisualization({ sessionId }: Props) {
  const [data, setData] = useState<VotesMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatementIndex, setSelectedStatementIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analysis/votes-matrix?sessionId=${sessionId}`);
        if (!res.ok) {
          throw new Error("投票行列の取得に失敗しました");
        }
        const matrixData = await res.json();
        setData(matrixData);
      } catch (e) {
        console.error(e);
        setError(
          e instanceof Error
            ? e.message
            : "投票行列の取得中にエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    }
    if (sessionId) {
      load();
    }
  }, [sessionId]);

  if (loading) {
    return <p className="text-sm text-text-muted">読み込み中...</p>;
  }

  if (error) {
    return (
      <p className="rounded border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (!data || data.participants.length === 0 || data.statements.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        このセッションには、まだ投票データがありません。
      </p>
    );
  }

  // Calculate vote distribution for a statement
  const getStatementVoteDistribution = (statementIndex: number) => {
    const votes = data.matrix.map((row) => row[statementIndex]).filter((v) => v !== null) as number[];
    const total = votes.length;
    if (total === 0) {
      return { agree: 0, disagree: 0, pass: 0, total: 0 };
    }
    const agree = votes.filter((v) => v === 1).length;
    const disagree = votes.filter((v) => v === -1).length;
    const pass = votes.filter((v) => v === 0).length;
    return {
      agree: agree / total,
      disagree: disagree / total,
      pass: pass / total,
      total
    };
  };

  // Calculate participant vote pattern (for similarity visualization)
  const getParticipantVotePattern = (participantIndex: number) => {
    return data.matrix[participantIndex];
  };

  // Calculate similarity between two participants (cosine similarity on non-null votes)
  const calculateSimilarity = (p1Index: number, p2Index: number): number => {
    const p1 = data.matrix[p1Index];
    const p2 = data.matrix[p2Index];
    
    let dotProduct = 0;
    let p1Norm = 0;
    let p2Norm = 0;
    let commonVotes = 0;

    for (let i = 0; i < p1.length; i++) {
      if (p1[i] !== null && p2[i] !== null) {
        dotProduct += (p1[i] as number) * (p2[i] as number);
        p1Norm += (p1[i] as number) ** 2;
        p2Norm += (p2[i] as number) ** 2;
        commonVotes++;
      }
    }

    if (commonVotes === 0 || p1Norm === 0 || p2Norm === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(p1Norm) * Math.sqrt(p2Norm));
  };

  // Get vote color
  const getVoteColor = (vote: number | null) => {
    if (vote === null) return "bg-slate-100";
    if (vote === 1) return "bg-emerald-500";
    if (vote === -1) return "bg-rose-500";
    return "bg-slate-400";
  };

  // Get vote label
  const getVoteLabel = (vote: number | null) => {
    if (vote === null) return "未投票";
    if (vote === 1) return "賛成";
    if (vote === -1) return "反対";
    return "パス";
  };

  const selectedDist = selectedStatementIndex !== null
    ? getStatementVoteDistribution(selectedStatementIndex)
    : null;

  return (
    <div className="space-y-6">
      {/* Statement selector */}
      <Card className="p-4">
        <h3 className="text-sm font-bold text-text-main mb-3">
          命題を選択して投票分布を確認
        </h3>
        <div className="grid gap-2 max-h-64 overflow-y-auto">
          {data.statements.map((stmt, idx) => {
            const dist = getStatementVoteDistribution(idx);
            const isSelected = selectedStatementIndex === idx;
            return (
              <button
                key={stmt.id}
                onClick={() => setSelectedStatementIndex(isSelected ? null : idx)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 hover:border-primary/50"
                }`}
              >
                <div className="text-sm font-medium text-text-main mb-1">
                  {stmt.textJa}
                </div>
                <div className="flex gap-2 text-xs text-text-sub">
                  <span>賛成: {Math.round(dist.agree * 100)}%</span>
                  <span>反対: {Math.round(dist.disagree * 100)}%</span>
                  <span>パス: {Math.round(dist.pass * 100)}%</span>
                  <span className="text-text-muted">({dist.total}票)</span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected statement detail */}
      {selectedStatementIndex !== null && selectedDist && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-text-main mb-4">
            {data.statements[selectedStatementIndex].textJa}
          </h3>
          
          {/* Vote distribution bars */}
          <div className="space-y-4 mb-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-emerald-600">賛成</span>
                <span className="text-xs font-bold text-text-main">
                  {Math.round(selectedDist.agree * 100)}% ({Math.round(selectedDist.agree * selectedDist.total)}票)
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-1000"
                  style={{ width: `${selectedDist.agree * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-rose-600">反対</span>
                <span className="text-xs font-bold text-text-main">
                  {Math.round(selectedDist.disagree * 100)}% ({Math.round(selectedDist.disagree * selectedDist.total)}票)
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-1000"
                  style={{ width: `${selectedDist.disagree * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-500">パス</span>
                <span className="text-xs font-bold text-text-main">
                  {Math.round(selectedDist.pass * 100)}% ({Math.round(selectedDist.pass * selectedDist.total)}票)
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 transition-all duration-1000"
                  style={{ width: `${selectedDist.pass * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Participant votes grid */}
          <div>
            <h4 className="text-sm font-bold text-text-main mb-3">
              参加者の投票パターン ({data.participants.length}名)
            </h4>
            <div className="grid grid-cols-10 gap-1 max-h-96 overflow-y-auto p-2 bg-slate-50 rounded-lg">
              {data.participants.map((participant, pIdx) => {
                const vote = data.matrix[pIdx][selectedStatementIndex];
                return (
                  <div
                    key={participant.id}
                    className={`aspect-square rounded flex items-center justify-center text-xs font-bold text-white transition-all hover:scale-110 ${getVoteColor(vote)}`}
                    title={`参加者 ${pIdx + 1}: ${getVoteLabel(vote)}`}
                  >
                    {vote === 1 ? "✓" : vote === -1 ? "✗" : vote === 0 ? "○" : "—"}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-text-sub">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                <span>賛成</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-rose-500 rounded"></div>
                <span>反対</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-slate-400 rounded"></div>
                <span>パス</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-slate-100 rounded"></div>
                <span>未投票</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Participant similarity matrix (simplified) */}
      {data.participants.length > 1 && (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-text-main mb-3">
            参加者間の意見類似度（簡易版）
          </h3>
          <p className="text-xs text-text-sub mb-4">
            各参加者の投票パターンの類似度を表示します。色が濃いほど意見が近い参加者です。
          </p>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${data.participants.length + 1}, minmax(0, 1fr))` }}>
            {/* Header row */}
            <div className="text-xs font-bold text-text-muted p-1"></div>
            {data.participants.map((_, idx) => (
              <div key={idx} className="text-xs font-bold text-text-muted p-1 text-center">
                P{idx + 1}
              </div>
            ))}
            {/* Rows */}
            {data.participants.map((_, p1Idx) => (
              <div key={p1Idx} className="contents">
                <div className="text-xs font-bold text-text-muted p-1">
                  P{p1Idx + 1}
                </div>
                {data.participants.map((_, p2Idx) => {
                  const similarity = p1Idx === p2Idx
                    ? 1
                    : calculateSimilarity(p1Idx, p2Idx);
                  const intensity = Math.max(0, Math.min(1, (similarity + 1) / 2)); // Normalize to 0-1
                  return (
                    <div
                      key={p2Idx}
                      className="aspect-square rounded flex items-center justify-center text-xs font-bold text-white"
                      style={{
                        backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                      }}
                      title={`P${p1Idx + 1} と P${p2Idx + 1} の類似度: ${(similarity * 100).toFixed(1)}%`}
                    >
                      {p1Idx === p2Idx ? "—" : similarity > 0.5 ? "✓" : similarity > 0 ? "○" : "✗"}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

