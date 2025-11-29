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
    let statements = await prisma.statement.findMany({
      where: {
        sessionId,
        selected_for_voting: true
      },
      orderBy: { id: "asc" }
    });

    // もし statements が存在しない場合、APS承認済みの命題から自動生成
    if (statements.length === 0) {
      const apsApprovedPropositions = await prisma.proposition.findMany({
        where: {
          sessionId,
          status_aps_approved: true
        },
        orderBy: { id: "asc" }
      });

      if (apsApprovedPropositions.length > 0) {
        // OpenAI で投票文に変換
        const { simpleChatCompletion } = await import("@/lib/openai");
        
        const inputItems = apsApprovedPropositions.map((p: any) => ({
          id: p.id,
          ja_text: p.ja_text
        }));

        const systemPrompt =
          "あなたはPolis型のYes/No投票文を整形する専門家です。" +
          "与えられた日本語の命題（政策的なアイデア・論点）を、参加者が「賛成 / 反対 / パス」で答えやすい文に整形してください。" +
          "Polisスタイルに合わせて、可能であれば「〜すべきだ。」「〜である。」など、評価対象が明確な文にしてください。" +
          "二重否定は避け、できるだけ一つの論点に絞った文にします。" +
          "各命題について、次の情報を返してください: " +
          "1) 日本語の投票文(text_ja) 2) 対応する自然な英訳(text_en)。" +
          "必ず次のJSON形式でのみ出力してください: " +
          '{"items":[{"id":"元のid","text_ja":"〜すべきだ。形式の日本語","text_en":"対応する英語文"},...]}';

        const userPrompt = JSON.stringify({ items: inputItems });

        const content = await simpleChatCompletion({
          system: systemPrompt,
          user: userPrompt
        });

        let outputItems: Array<{ id: string; text_ja: string; text_en?: string }> = [];
        try {
          const parsed = JSON.parse(content) as { items?: Array<{ id: string; text_ja: string; text_en?: string }> };
          outputItems = parsed.items ?? [];
        } catch {
          // フォールバック: 行ごとに text_ja を扱い、英訳は空にする
          const lines = content
            .split(/\n+/)
            .map((s) => s.replace(/^[-*]\s*/, "").trim())
            .filter(Boolean);
          outputItems = apsApprovedPropositions.map((p: any, idx: number) => ({
            id: p.id,
            text_ja: lines[idx] ?? p.ja_text,
            text_en: undefined
          }));
        }

        const byId = new Map(outputItems.map((i) => [i.id, i]));

        // 既存の statements をチェック
        const existingStatements = await prisma.statement.findMany({
          where: {
            sessionId,
            propositionId: { in: apsApprovedPropositions.map((p: any) => p.id) }
          }
        });

        const existingByPropositionId = new Map(
          existingStatements.map((s: any) => [s.propositionId, s])
        );

        // 新規作成が必要な命題のみ抽出
        const toCreate = apsApprovedPropositions.filter(
          (p: any) => !existingByPropositionId.has(p.id)
        );

        if (toCreate.length > 0) {
          // 新規 statements を作成
          const newStatements = await prisma.$transaction(
            toCreate.map((p: any) => {
              const item = byId.get(p.id);
              const text_ja = item?.text_ja ?? p.ja_text;
              const text_en = item?.text_en ?? null;
              return prisma.statement.create({
                data: {
                  sessionId,
                  propositionId: p.id,
                  text_ja,
                  text_en,
                  selected_for_voting: true
                }
              });
            })
          );
          // 既存と新規を結合
          statements = [...existingStatements, ...newStatements];
        } else {
          statements = existingStatements;
        }
      }
    }

    if (!participantId) {
      // キャメルケースに正規化
      const normalized = statements.map((s: any) => ({
        id: s.id,
        textJa: s.text_ja,
        textEn: s.text_en,
      }));
      return NextResponse.json({ statements: normalized });
    }

    const votes = await prisma.vote.findMany({
      where: {
        participantId,
        statementId: { in: statements.map((s: any) => s.id) }
      }
    });

    const voteByStatementId = new Map(
      votes.map((v: any) => [v.statementId, v.vote])
    );

    const enriched = statements.map((s: any) => ({
      id: s.id,
      textJa: s.text_ja,
      textEn: s.text_en,
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


