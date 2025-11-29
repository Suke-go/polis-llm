import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const participantId = searchParams.get("participantId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  try {
    const statements = await prisma.statement.findMany({
      where: {
        sessionId,
        selectedForVoting: true
      },
      orderBy: { id: "asc" }
    });

    if (!participantId) {
      return NextResponse.json({ statements });
    }

    const votes = await prisma.vote.findMany({
      where: {
        participantId,
        statementId: { in: statements.map((s) => s.id) }
      }
    });

    const voteByStatementId = new Map(
      votes.map((v) => [v.statementId, v.vote])
    );

    const enriched = statements.map((s) => ({
      ...s,
      currentVote: voteByStatementId.get(s.id) ?? null
    }));

    return NextResponse.json({ statements: enriched });
  } catch (error) {
    console.error("GET /api/statements error", error);
    return NextResponse.json(
      { error: "Failed to fetch statements" },
      { status: 500 }
    );
  }
}


