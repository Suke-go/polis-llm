'use client';

import * as React from 'react';

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
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
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
      <div className="text-sm text-gray-500">
        まだこのセッションの投票結果がありません。投票が集まるとここに表示されます。
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {results.map((item) => (
        <article
          key={item.statementId}
          className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <h3 className="mb-3 text-sm font-medium text-gray-900">
            {item.textJa}
          </h3>

          <div className="mb-2 flex items-center justify-between text-xs text-gray-600">
            <span>賛成 / 反対 / Pass</span>
            <span>
              {(item.agreeRate * 100).toFixed(0)}% /{' '}
              {(item.disagreeRate * 100).toFixed(0)}% /{' '}
              {(item.passRate * 100).toFixed(0)}%
            </span>
          </div>

          <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="float-left h-full bg-emerald-500"
              style={{ width: `${item.agreeRate * 100}%` }}
            />
            <div
              className="float-left h-full bg-rose-500"
              style={{ width: `${item.disagreeRate * 100}%` }}
            />
            <div
              className="float-left h-full bg-slate-400"
              style={{ width: `${item.passRate * 100}%` }}
            />
          </div>

          <div className="mt-1 flex justify-between text-[11px] text-gray-500">
            <span>賛成</span>
            <span>反対</span>
            <span>Pass</span>
          </div>
        </article>
      ))}
    </div>
  );
}


