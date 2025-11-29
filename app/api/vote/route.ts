import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Body = {
  participantId: string;
  statementId: string;
  vote: number;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { participantId, statementId, vote } = body;

  if (!participantId || !statementId || typeof vote !== "number") {
    return NextResponse.json(
      { error: "participantId, statementId and vote are required" },
      { status: 400 }
    );
  }

  if (![1, 0, -1].includes(vote)) {
    return NextResponse.json(
      { error: "vote must be one of 1 (Yes), 0 (Pass), -1 (No)" },
      { status: 400 }
    );
  }

  try {
    const upserted = await prisma.vote.upsert({
      where: {
        participantId_statementId: {
          participantId,
          statementId
        }
      },
      update: {
        vote
      },
      create: {
        participantId,
        statementId,
        vote
      }
    });

    return NextResponse.json({ vote: upserted });
  } catch (error) {
    console.error("POST /api/vote error", error);
    return NextResponse.json(
      { error: "Failed to submit vote" },
      { status: 500 }
    );
  }
}


