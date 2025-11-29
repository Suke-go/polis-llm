import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StepNav, PrevNextNav } from "../StepNav";

interface Props {
  params: { sessionId: string };
}

export const dynamic = "force-dynamic";

export default async function PropositionsPage({ params }: Props) {
  const session = await prisma.session.findUnique({
    where: { id: params.sessionId },
    include: {
      propositions: {
        orderBy: { createdAt: "asc" } as any // createdAt がある場合を想定
      }
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
          フェーズ3 / 4: 日本語命題の生成・編集・承認の結果を確認
        </p>
        <StepNav sessionId={session.id} />
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
        <h2 className="text-sm font-semibold">日本語命題リスト</h2>
        <p className="text-xs text-slate-400">
          ここでは、承認前後に関わらず、このセッションに紐づく日本語命題を一覧表示します。
        </p>
        {propositions.length === 0 ? (
          <p className="text-xs text-slate-500 mt-2">まだ命題がありません。</p>
        ) : (
          <ul className="mt-3 space-y-2 max-h-80 overflow-auto pr-1 text-xs">
            {propositions.map((p, idx) => (
              <li
                key={p.id}
                className="rounded-md border border-slate-800 bg-slate-950/60 p-2"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    #{idx + 1}{" "}
                    {p.statusEditApproved ? "（編集承認済）" : "（未承認）"}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-slate-200">
                  {p.jaText}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PrevNextNav sessionId={session.id} current="propositions" />
    </main>
  );
}


