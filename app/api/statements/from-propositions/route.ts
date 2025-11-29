import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Body = {
  sessionId: string;
  selectedPropositionIds: string[];
};

function toVotingSentence(jaText: string): string {
  const trimmed = jaText.trim();
  if (trimmed.endsWith("べきだ。") || trimmed.endsWith("べきだ")) {
    return trimmed.endsWith("べきだ") ? `${trimmed}。` : trimmed;
  }
  // 末尾の句点を除去して「〜すべきだ。」を付与する簡易実装
  const withoutPeriod = trimmed.replace(/。+$/u, "");
  return `${withoutPeriod}は実現されるべきだ。`;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sessionId, selectedPropositionIds } = body;

  if (!sessionId || !Array.isArray(selectedPropositionIds)) {
    return NextResponse.json(
      { error: "sessionId and selectedPropositionIds are required" },
      { status: 400 }
    );
  }

  if (selectedPropositionIds.length === 0) {
    return NextResponse.json(
      { error: "No propositions selected" },
      { status: 400 }
    );
  }

  try {
    const propositions = await prisma.proposition.findMany({
      where: {
        sessionId,
        id: { in: selectedPropositionIds }
      }
    });

    if (propositions.length === 0) {
      return NextResponse.json(
        { error: "No propositions found for given ids" },
        { status: 404 }
      );
    }

    const createdStatements = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const prop of propositions) {
        const textJa = toVotingSentence(prop.jaText);

        const upserted = await tx.statement.upsert({
          where: {
            sessionId_propositionId: {
              sessionId,
              propositionId: prop.id
            }
          },
          update: {
            textJa,
            selectedForVoting: true
          },
          create: {
            sessionId,
            propositionId: prop.id,
            textJa,
            selectedForVoting: true
          }
        });

        results.push(upserted);
      }

      return results;
    });

    return NextResponse.json({ statements: createdStatements });
  } catch (error) {
    console.error("POST /api/statements/from-propositions error", error);
    return NextResponse.json(
      { error: "Failed to create statements" },
      { status: 500 }
    );
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { simpleChatCompletion } from "@/lib/openai";

interface Body {
  sessionId?: string;
  selectedPropositionIds?: string[];
}

interface OpenAIInputItem {
  id: string;
  ja_text: string;
}

interface OpenAIOutputItem {
  id: string;
  text_ja: string;
  text_en?: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;

  if (!body.sessionId || !Array.isArray(body.selectedPropositionIds)) {
    return new Response(JSON.stringify({ error: "Invalid body" }), {
      status: 400
    });
  }

  if (body.selectedPropositionIds.length === 0) {
    return new Response(JSON.stringify({ error: "No proposition ids" }), {
      status: 400
    });
  }

  const propositions = await prisma.proposition.findMany({
    where: {
      sessionId: body.sessionId,
      id: { in: body.selectedPropositionIds }
    }
  });

  if (propositions.length === 0) {
    return new Response(
      JSON.stringify({ error: "No propositions found for session" }),
      { status: 404 }
    );
  }

  const inputItems: OpenAIInputItem[] = propositions.map((p) => ({
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

  let outputItems: OpenAIOutputItem[] = [];
  try {
    const parsed = JSON.parse(content) as { items?: OpenAIOutputItem[] };
    outputItems = parsed.items ?? [];
  } catch {
    // フォールバック: 行ごとに text_ja を扱い、英訳は空にする
    const lines = content
      .split(/\n+/)
      .map((s) => s.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
    outputItems = propositions.map((p, idx) => ({
      id: p.id,
      text_ja: lines[idx] ?? p.ja_text,
      text_en: undefined
    }));
  }

  if (outputItems.length === 0) {
    return new Response(
      JSON.stringify({ error: "LLM did not return any items" }),
      { status: 500 }
    );
  }

  const byId = new Map(outputItems.map((i) => [i.id, i]));

  // 既存の statements を削除してから再作成（セッション + 命題単位）
  await prisma.statement.deleteMany({
    where: {
      sessionId: body.sessionId,
      propositionId: { in: propositions.map((p) => p.id) }
    }
  });

  const created = await prisma.$transaction(
    propositions.map((p) => {
      const item = byId.get(p.id);
      const text_ja = item?.text_ja ?? p.ja_text;
      const text_en = item?.text_en ?? null;
      return prisma.statement.create({
        data: {
          sessionId: body.sessionId!,
          propositionId: p.id,
          text_ja,
          text_en,
          selected_for_voting: true
        }
      });
    })
  );

  return Response.json({ statements: created });
}


