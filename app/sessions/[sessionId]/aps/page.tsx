import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StepNav } from "../StepNav";
import { PhaseNav } from "../PhaseNav";
import ApsPageClient from "./ApsPageClient";

interface Props {
  params: { sessionId: string };
}

export const dynamic = "force-dynamic";

export default async function ApsPage({ params }: Props) {
  const session = await prisma.session.findUnique({
    where: { id: params.sessionId },
    include: {
      propositions: {
        orderBy: { id: "asc" }
      }
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
          フェーズ1: 課題を設定する - ステップ4 / 4: 翻訳・APS・再翻訳の結果を確認
        </p>
        <PhaseNav sessionId={session.id} />
        <StepNav sessionId={session.id} />
      </header>

      <ApsPageClient 
        sessionId={session.id} 
        initialPropositions={session.propositions}
      />
    </main>
  );
}


