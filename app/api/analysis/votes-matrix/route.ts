import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/analysis/votes-matrix?sessionId=...
 * 
 * Returns a votes matrix for Polis-style visualization:
 * - participants: Array of participant IDs
 * - statements: Array of statement info
 * - matrix: 2D array [participantIndex][statementIndex] = vote value (1, -1, 0, or null)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  try {
    // Get all statements for this session
    const statements = await prisma.statement.findMany({
      where: {
        sessionId,
        selected_for_voting: true
      },
      orderBy: { id: "asc" }
    });

    // Get all participants for this session
    const participants = await prisma.participant.findMany({
      where: { sessionId },
      orderBy: { id: "asc" }
    });

    // Get all votes
    const votes = await prisma.vote.findMany({
      where: {
        participant: { sessionId },
        statement: { sessionId, selected_for_voting: true }
      }
    });

    // Build vote map: (participantId, statementId) -> vote
    const voteMap = new Map<string, number>();
    votes.forEach((v: any) => {
      voteMap.set(`${v.participantId}:${v.statementId}`, v.vote);
    });

    // Build matrix
    const matrix: (number | null)[][] = participants.map((p: any) => {
      return statements.map((s: any) => {
        const key = `${p.id}:${s.id}`;
        return voteMap.get(key) ?? null;
      });
    });

    return NextResponse.json({
      participants: participants.map((p: any) => ({
        id: p.id,
        createdAt: p.createdAt
      })),
      statements: statements.map((s: any) => ({
        id: s.id,
        textJa: s.text_ja,
        textEn: s.text_en
      })),
      matrix
    });
  } catch (error) {
    console.error("GET /api/analysis/votes-matrix error", error);
    return NextResponse.json(
      { error: "Failed to fetch votes matrix" },
      { status: 500 }
    );
  }
}

