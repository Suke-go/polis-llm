import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    // 分析結果を取得
    const analysisResult = await prisma.analysisResult.findUnique({
      where: { sessionId }
    });

    if (analysisResult) {
      return NextResponse.json({
        results: analysisResult.resultsJson
      });
    }

    // 分析結果がない場合は自動的に実行
    const runRes = await fetch(`${req.nextUrl.origin}/api/analysis/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });

    if (!runRes.ok) {
      return NextResponse.json(
        { error: "Failed to run analysis" },
        { status: 500 }
      );
    }

    const runData = await runRes.json();
    return NextResponse.json({ results: runData.results });
  } catch (error) {
    console.error("GET /api/analysis/result error", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis results" },
      { status: 500 }
    );
  }
}

