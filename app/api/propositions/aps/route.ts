import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { simpleChatCompletion } from "@/lib/openai";
import { callGemmaAps } from "@/lib/gemmaAps";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { sessionId?: string };
  if (!body.sessionId) {
    return new Response(JSON.stringify({ error: "sessionId is required" }), {
      status: 400
    });
  }

  const baseProps = await prisma.proposition.findMany({
    where: { sessionId: body.sessionId, status_edit_approved: true },
    orderBy: { id: "asc" }
  });

  if (baseProps.length === 0) {
    return new Response(
      JSON.stringify({ error: "No approved propositions to run APS" }),
      { status: 400 }
    );
  }

  // 1. 日本語命題を英訳して連結
  const jaJoined = baseProps.map((p) => p.ja_text).join("\n");
  const enText = await simpleChatCompletion({
    system:
      "あなたはプロの翻訳者です。以下の日本語の命題リストを自然な英文に翻訳してください。" +
      "各命題は改行区切りで与えられます。同じく改行区切りの英文リストとして出力してください。",
    user: jaJoined
  });

  // 2. Gemma-APS に投入して命題分割
  const apsResult = await callGemmaAps(enText);

  if (!apsResult.propositions.length) {
    return new Response(
      JSON.stringify({ error: "Gemma-APS returned no propositions" }),
      { status: 500 }
    );
  }

  // 3. 英文命題を日本語に逆翻訳
  const backJa = await simpleChatCompletion({
    system:
      "あなたはプロの翻訳者です。以下の英文の命題リストをニュアンスを保持したまま自然な日本語に翻訳してください。" +
      "各命題は改行区切りで与えられます。同じく改行区切りの日本語命題リストとして出力してください。",
    user: apsResult.propositions.join("\n")
  });

  const backJaItems = backJa
    .split(/\n+/)
    .map((s) => s.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  const minLen = Math.min(
    apsResult.propositions.length,
    backJaItems.length
  );

  // 4. 既存 propositions を一旦削除して、APS ベースの命題で再構成
  await prisma.proposition.deleteMany({
    where: { sessionId: body.sessionId }
  });

  const created = await prisma.$transaction(
    Array.from({ length: minLen }).map((_, i) =>
      prisma.proposition.create({
        data: {
          sessionId: body.sessionId!,
          en_text: apsResult.propositions[i],
          back_translated_ja: backJaItems[i],
          ja_text: backJaItems[i],
          translation_diff_score: 0,
          status_edit_approved: true,
          status_aps_approved: false
        }
      })
    )
  );

  return Response.json({ propositions: created });
}


