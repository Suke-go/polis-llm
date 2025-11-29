import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface EditedItem {
  id?: string;
  ja_text: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    sessionId?: string;
    editedItems?: EditedItem[];
  };
  if (!body.sessionId || !Array.isArray(body.editedItems)) {
    return new Response(JSON.stringify({ error: "Invalid body" }), {
      status: 400
    });
  }

  const existing = await prisma.proposition.findMany({
    where: { sessionId: body.sessionId }
  });

  const tx: any[] = [];

  // Update or create based on editedItems
  for (const item of body.editedItems) {
    if (item.id) {
      const found = existing.find((p) => p.id === item.id);
      if (found) {
        tx.push(
          prisma.proposition.update({
            where: { id: item.id },
            data: { ja_text: item.ja_text }
          })
        );
        continue;
      }
    }
    tx.push(
      prisma.proposition.create({
        data: {
          sessionId: body.sessionId,
          ja_text: item.ja_text
        }
      })
    );
  }

  // Delete propositions that are not in editedItems
  const keepIds = body.editedItems
    .map((i) => i.id)
    .filter((id): id is string => Boolean(id));
  tx.push(
    prisma.proposition.deleteMany({
      where: {
        sessionId: body.sessionId,
        id: { notIn: keepIds.length ? keepIds : [""] }
      }
    })
  );

  await prisma.$transaction(tx);

  await prisma.proposition.updateMany({
    where: { sessionId: body.sessionId },
    data: { status_edit_approved: true }
  });

  const updated = await prisma.proposition.findMany({
    where: { sessionId: body.sessionId },
    orderBy: { id: "asc" }
  });

  return Response.json({ propositions: updated });
}


