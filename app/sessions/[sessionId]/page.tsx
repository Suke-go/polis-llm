import { prisma } from "@/lib/prisma";
import SessionWizardClient from "./SessionWizardClient";
import { notFound } from "next/navigation";

interface Props {
  params: { sessionId: string };
}

export const dynamic = "force-dynamic";

export default async function SessionPage({ params }: Props) {
  const session = await prisma.session.findUnique({
    where: { id: params.sessionId },
    include: {
      stories: true,
      propositions: {
        orderBy: { id: "asc" }
      }
    }
  });

  if (!session) {
    notFound();
  }

  const story = session.stories[0] ?? null;

  return (
    <SessionWizardClient
      session={{
        id: session.id,
        title: session.title,
        prompt: session.prompt
      }}
      story={story}
      propositions={session.propositions}
    />
  );
}


