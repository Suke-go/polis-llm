import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StepNav, PrevNextNav } from "../StepNav";

interface Props {
  params: { sessionId: string };
}

export const dynamic = "force-dynamic";

export default async function ImagePage({ params }: Props) {
  const session = await prisma.session.findUnique({
    where: { id: params.sessionId },
    include: {
      propositions: true
    }
  });

  if (!session) notFound();

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-lg font-semibold mb-1">
          セッション: {session.title}
        </h1>
        <p className="text-xs text-slate-400 mb-3">
          フェーズ2 / 4: ストーリーから生成された代表画像を確認
        </p>
        <StepNav sessionId={session.id} />
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
        <h2 className="text-sm font-semibold">代表画像</h2>
        <p className="text-xs text-slate-400 mb-2">
          ここではストーリー承認後に生成された画像だけを確認します。
        </p>
        <div className="flex items-center justify-center h-64 rounded-md border border-slate-800 bg-slate-950/60 text-xs text-slate-500">
          {/* 本来は stories.image_url を読むが、スキーマ簡略化のため省略。 */}
          画像URLが保存されていればここに表示する想定です。
        </div>
      </section>

      <PrevNextNav sessionId={session.id} current="image" />
    </main>
  );
}


