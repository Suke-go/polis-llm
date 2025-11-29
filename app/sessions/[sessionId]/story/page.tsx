import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StepNav, PrevNextNav } from "../StepNav";

interface Props {
  params: { sessionId: string };
}

export const dynamic = "force-dynamic";

export default async function StoryPage({ params }: Props) {
  const session = await prisma.session.findUnique({
    where: { id: params.sessionId },
    include: { propositions: true }
  });

  if (!session) notFound();

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-lg font-semibold mb-1">
          セッション: {session.title}
        </h1>
        <p className="text-xs text-slate-400 mb-3">
          フェーズ1 / 4: プロンプトからストーリー・明文化を確認
        </p>
        <StepNav sessionId={session.id} />
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
        <h2 className="text-sm font-semibold">プロンプト</h2>
        <p className="text-xs text-slate-300 whitespace-pre-wrap">
          {session.prompt ?? "（プロンプト未入力）"}
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
        <h2 className="text-sm font-semibold">ストーリー / 明文化</h2>
        <p className="text-xs text-slate-400 mb-1">
          このページではストーリー生成フェーズの結果だけを確認します。
        </p>
        <p className="text-xs text-slate-500">
          （ストーリー本文は別 UI / 管理画面で扱う前提として、ここでは省略可能です）
        </p>
      </section>

      <PrevNextNav sessionId={session.id} current="story" />
    </main>
  );
}


