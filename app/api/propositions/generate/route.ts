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

  const story = await prisma.story.findUnique({
    where: { sessionId: body.sessionId }
  });
  if (!story) {
    return new Response(JSON.stringify({ error: "Story not found" }), {
      status: 404
    });
  }

  const systemPrompt =
    "あなたは公共政策の議論を設計するエキスパートです。" +
    "与えられた政策ストーリーから、「議論しやすい・するべき日本語命題」のリストを作成してください。" +
    "各命題は価値観・感情や具体的な想定を含んでいても良いですが、簡潔な文章でYes/Noで答えられる形にしてください。" +
    "JSON 形式で {\"items\": [\"命題1\", \"命題2\", ...]} の形で出力してください。";

  const content = await simpleChatCompletion({
    system: systemPrompt,
    user: story.policy_story_ja
  });

  let items: string[] = [];
  try {
    const parsed = JSON.parse(content) as { items?: string[] };
    items = parsed.items ?? [];
  } catch {
    items = content
      .split(/\n+/)
      .map((s) => s.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
  }

  if (items.length === 0) {
    return new Response(
      JSON.stringify({ error: "Failed to generate propositions" }),
      { status: 500 }
    );
  }

  // Remove existing non-approved propositions for this session and recreate
  await prisma.proposition.deleteMany({
    where: { sessionId: body.sessionId }
  });

  const created = await prisma.$transaction(
    items.map((ja_text) =>
      prisma.proposition.create({
        data: {
          sessionId: body.sessionId!,
          ja_text,
          status_edit_approved: false,
          status_aps_approved: false
        }
      })
    )
  );

  return Response.json({ propositions: created });
}


