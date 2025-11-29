import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { sessionId?: string };
  if (!body.sessionId) {
    return new Response(JSON.stringify({ error: "sessionId is required" }), {
      status: 400
    });
  }

  await prisma.proposition.updateMany({
    where: { sessionId: body.sessionId },
    data: { status_aps_approved: true }
  });

  const updated = await prisma.proposition.findMany({
    where: { sessionId: body.sessionId },
    orderBy: { id: "asc" }
  });

  return Response.json({ propositions: updated });
}


