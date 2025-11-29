import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StepNav } from "../StepNav";
import { PhaseNav } from "../PhaseNav";
import PropositionsPageClient from "./PropositionsPageClient";

interface Props {
  params: { sessionId: string };
}

export const dynamic = "force-dynamic";

export default async function PropositionsPage({ params }: Props) {
  const session = await prisma.session.findUnique({
    where: { id: params.sessionId },
    include: {
      propositions: {
        orderBy: { id: "asc" },
      },
    },
  });

  if (!session) notFound();

  return (
    <main className="space-y-8 animate-drop-in">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main mb-2">
            Session: {session.title}
          </h1>
          <p className="text-sm text-text-muted">
            Phase 1: 課題を設定する - Step 3/4
          </p>
        </div>
        <PhaseNav sessionId={session.id} />
        <StepNav sessionId={session.id} />
      </header>

      <PropositionsPageClient
        sessionId={session.id}
        initialPropositions={session.propositions}
      />
    </main>
  );
}
