import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { sessionId?: string };
  if (!body.sessionId) {
    return new Response(JSON.stringify({ error: "sessionId is required" }), {
      status: 400
    });
  }

  const story = await prisma.story.update({
    where: { sessionId: body.sessionId },
    data: { status_story_approved: true }
  });

  return Response.json({ story });
}


