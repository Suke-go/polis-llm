import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StepNav } from "../StepNav";
import { PhaseNav } from "../PhaseNav";
import ImagePageClient from "./ImagePageClient";

interface Props {
  params: { sessionId: string };
}

export const dynamic = "force-dynamic";

export default async function ImagePage({ params }: Props) {
  const session = await prisma.session.findUnique({
    where: { id: params.sessionId },
    include: {
      stories: true,
    },
  });

  if (!session) notFound();

  const story = session.stories[0] ?? null;

  return (
    <main className="space-y-8 animate-drop-in">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main mb-2">
            Session: {session.title}
          </h1>
          <p className="text-sm text-text-muted">
            Phase 1: 課題を設定する - Step 2/4
          </p>
        </div>
        <PhaseNav sessionId={session.id} />
        <StepNav sessionId={session.id} />
      </header>

      <ImagePageClient sessionId={session.id} initialStory={story} />
    </main>
  );
}
