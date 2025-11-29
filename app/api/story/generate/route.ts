import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { simpleChatCompletion } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { sessionId?: string };
  if (!body.sessionId) {
    return new Response(JSON.stringify({ error: "sessionId is required" }), {
      status: 400
    });
  }

  const session = await prisma.session.findUnique({
    where: { id: body.sessionId }
  });
  if (!session) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404
    });
  }

  if (!session.prompt) {
    return new Response(JSON.stringify({ error: "Session prompt is required" }), {
      status: 400
    });
  }

  const systemPrompt =
    "あなたはSFプロトタイピングと公共政策に詳しいストーリーテラーです。" +
    "ユーザーのプロンプトから、(1) 未来の状況を描いた日本語のストーリー(sf_story_ja) と " +
    "(2) 政策議論しやすいように明文化した日本語ストーリー(policy_story_ja) を生成してください。" +
    "JSON 形式で {\"sf_story_ja\": \"...\", \"policy_story_ja\": \"...\"} の形で出力してください。";

  const content = await simpleChatCompletion({
    system: systemPrompt,
    user: session.prompt
  });

  let sf_story_ja = "";
  let policy_story_ja = "";
  try {
    const parsed = JSON.parse(content) as {
      sf_story_ja?: string;
      policy_story_ja?: string;
    };
    sf_story_ja = parsed.sf_story_ja ?? "";
    policy_story_ja = parsed.policy_story_ja ?? "";
  } catch {
    // fallback: use whole text as policy_story_ja
    sf_story_ja = content;
    policy_story_ja = content;
  }

  if (!sf_story_ja || !policy_story_ja) {
    return new Response(
      JSON.stringify({ error: "Failed to parse story output" }),
      { status: 500 }
    );
  }

  const story = await prisma.story.upsert({
    where: { sessionId: session.id },
    update: {
      sf_story_ja,
      policy_story_ja,
      status_story_approved: false
    },
    create: {
      sessionId: session.id,
      sf_story_ja,
      policy_story_ja
    }
  });

  return Response.json({ story });
}


