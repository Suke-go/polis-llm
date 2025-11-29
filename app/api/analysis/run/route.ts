import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Body = {
  sessionId: string;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sessionId } = body;

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  try {
    // 投票対象の命題を取得
    const statements = await prisma.statement.findMany({
      where: {
        sessionId,
        selected_for_voting: true
      }
    });

    if (statements.length === 0) {
      return NextResponse.json(
        { error: "No statements found for voting" },
        { status: 404 }
      );
    }

    // 各命題に対する投票を集計
    const statementIds = statements.map((s) => s.id);
    const votes = await prisma.vote.findMany({
      where: {
        statementId: { in: statementIds }
      }
    });

    // 命題ごとに集計
    const results = statements.map((statement) => {
      const statementVotes = votes.filter((v) => v.statementId === statement.id);
      const totalVotes = statementVotes.length;

      if (totalVotes === 0) {
      return {
        statementId: statement.id,
        textJa: statement.text_ja,
        agreeRate: 0,
        disagreeRate: 0,
        passRate: 0,
        totalVotes: 0
      };
      }

      const agreeCount = statementVotes.filter((v) => v.vote === 1).length;
      const disagreeCount = statementVotes.filter((v) => v.vote === -1).length;
      const passCount = statementVotes.filter((v) => v.vote === 0).length;

      return {
        statementId: statement.id,
        textJa: statement.text_ja,
        agreeRate: agreeCount / totalVotes,
        disagreeRate: disagreeCount / totalVotes,
        passRate: passCount / totalVotes,
        totalVotes
      };
    });

    // analysis_results に保存（UPSERT）
    await prisma.analysisResult.upsert({
      where: { sessionId },
      update: {
        resultsJson: results
      },
      create: {
        sessionId,
        resultsJson: results
      }
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("POST /api/analysis/run error", error);
    return NextResponse.json(
      { error: "Failed to run analysis" },
      { status: 500 }
    );
  }
}

