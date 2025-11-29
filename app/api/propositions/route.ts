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
    // セッション情報とストーリー情報も取得
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        stories: {
          where: { sessionId },
          take: 1
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const propositions = await prisma.proposition.findMany({
      where: {
        sessionId,
        status_aps_approved: true
      },
      orderBy: { id: "asc" }
    });

    // Prisma Client returns snake_case, but we'll normalize to camelCase for frontend
    const normalizedPropositions = propositions.map((p: any) => ({
      id: p.id,
      jaText: p.ja_text ?? "",
      enText: p.en_text ?? null,
      backTranslatedJa: p.back_translated_ja ?? null,
      statusEditApproved: p.status_edit_approved ?? false,
      statusApsApproved: p.status_aps_approved ?? false,
    }));

    return NextResponse.json({
      session: {
        title: session.title,
        imageUrl: session.stories[0]?.image_url ?? null
      },
      propositions: normalizedPropositions
    });
  } catch (error) {
    console.error("GET /api/propositions error", error);
    return NextResponse.json(
      { error: "Failed to fetch propositions" },
      { status: 500 }
    );
  }
}


