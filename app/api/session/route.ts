import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { title?: string; prompt?: string };
  if (!body.title || !body.prompt) {
    return new Response(JSON.stringify({ error: "Invalid body" }), {
      status: 400
    });
  }
  const session = await prisma.session.create({
    data: {
      title: body.title,
      prompt: body.prompt
    },
    select: { id: true }
  });
  return Response.json({ sessionId: session.id });
}


