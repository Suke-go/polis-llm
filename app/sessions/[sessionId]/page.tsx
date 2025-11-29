import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface Props {
  params: { sessionId: string };
}

export const dynamic = "force-dynamic";

export default async function SessionPage({ params }: Props) {
  const session = await prisma.session.findUnique({
    where: { id: params.sessionId }
  });

  if (!session) {
    notFound();
  }

  // 最初の工程（ストーリー）にリダイレクト
  redirect(`/sessions/${params.sessionId}/story`);
}


