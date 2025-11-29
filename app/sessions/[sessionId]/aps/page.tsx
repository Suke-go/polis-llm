import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StepNav, PrevNextNav } from "../StepNav";

interface Props {
  params: { sessionId: string };
}

export const dynamic = "force-dynamic";

export default async function ApsPage({ params }: Props) {
  const session = await prisma.session.findUnique({
    where: { id: params.sessionId },
    include: {
      propositions: true
    }
  });

  if (!session) notFound();

  const propositions = session.propositions;

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-lg font-semibold mb-1">
          セッション: {session.title}
        </h1>
        <p className="text-xs text-slate-400 mb-3">
          フェーズ4 / 4: 翻訳・APS・再翻訳の結果を確認
        </p>
        <StepNav sessionId={session.id} />
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
        <h2 className="text-sm font-semibold">APS 結果（命題ごとの日英対応）</h2>
        <p className="text-xs text-slate-400">
          ここでは、Gemma-APS による英文命題と、その再翻訳結果を確認します。
        </p>
        {propositions.length === 0 ? (
          <p className="text-xs text-slate-500 mt-2">
            まだ APS 対象の命題がありません。
          </p>
        ) : (
          <div className="mt-3 grid gap-2 md:grid-cols-3 max-h-80 overflow-auto pr-1 text-[11px]">
            {propositions.map((p, idx) => (
              <div
                key={p.id}
                className="rounded-md border border-slate-800 bg-slate-950/60 p-2 space-y-1"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400">
                    命題 #{idx + 1}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {p.statusApsApproved ? "APS承認済" : "APS未承認"}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-300 mb-0.5">
                    英文命題 (enText)
                  </p>
                  <p className="rounded border border-slate-800 bg-slate-900 px-2 py-1 min-h-[3rem]">
                    {p.enText ?? (
                      <span className="text-slate-600">なし</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-300 mb-0.5">
                    再翻訳（backTranslatedJa）
                  </p>
                  <p className="rounded border border-slate-800 bg-slate-900 px-2 py-1 min-h-[3rem]">
                    {p.backTranslatedJa ?? (
                      <span className="text-slate-600">なし</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <PrevNextNav sessionId={session.id} current="aps" />
    </main>
  );
}


