'use client';

import * as React from 'react';
import { Card } from "@/components/ui/Card";

export type StatementResult = {
  statementId: string;
  textJa: string;
  agreeRate: number;
  disagreeRate: number;
  passRate: number;
};

type Props = {
  sessionId: string;
};

export function StatementResultsGrid({ sessionId }: Props) {
  const [results, setResults] = React.useState<StatementResult[] | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function fetchResults() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/analysis/result?sessionId=${encodeURIComponent(sessionId)}`,
          {
            method: 'GET',
          },
        );

        if (!res.ok) {
          throw new Error(`Failed to load results (${res.status})`);
        }

        const data = (await res.json()) as {
          results: StatementResult[];
        };

        if (!isMounted) return;
        setResults(data.results ?? []);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to fetch analysis results', err);
        setError('可視化データの取得に失敗しました。時間をおいて再度お試しください。');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  if (isLoading && !results) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        集計中です…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-sm text-text-muted">
        まだこのセッションの投票結果がありません。投票が集まるとここに表示されます。
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {results.map((item) => (
        <Card
          key={item.statementId}
          className="flex flex-col"
        >
          <h3 className="mb-4 text-sm font-medium text-text-main leading-relaxed">
            {item.textJa}
          </h3>

          <div className="mb-3 flex items-center justify-between text-xs font-bold text-text-sub">
            <span>賛成 / 反対 / Pass</span>
            <span>
              {(item.agreeRate * 100).toFixed(0)}% /{' '}
              {(item.disagreeRate * 100).toFixed(0)}% /{' '}
              {(item.passRate * 100).toFixed(0)}%
            </span>
          </div>

          <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 flex">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${item.agreeRate * 100}%` }}
            />
            <div
              className="h-full bg-rose-500"
              style={{ width: `${item.disagreeRate * 100}%` }}
            />
            <div
              className="h-full bg-slate-400"
              style={{ width: `${item.passRate * 100}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-text-muted font-medium">
            <span className="text-emerald-600">賛成</span>
            <span className="text-rose-600">反対</span>
            <span className="text-slate-500">Pass</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
