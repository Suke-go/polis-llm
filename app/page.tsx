export default function HomePage() {
  return (
    <main className="space-y-4">
      <p className="text-sm text-slate-300">
        このプロトタイプでは、フロー1で作成されたセッションIDを直接指定して、
        命題タイル表示と Polis 型投票 UI をテストできます。
      </p>
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold">セッションへのショートカット</h2>
        <p className="mt-2 text-sm text-slate-300">
          ブラウザのURLバーで{" "}
          <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">
            /sessions/&lt;sessionId&gt;/tiles
          </code>{" "}
          または{" "}
          <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">
            /sessions/&lt;sessionId&gt;/vote
          </code>{" "}
          にアクセスしてください。
        </p>
      </div>
    </main>
  );
}


