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
    const propositions = await prisma.proposition.findMany({
      where: {
        sessionId,
        statusApsApproved: true
      },
      orderBy: { id: "asc" }
    });

    return NextResponse.json({ propositions });
  } catch (error) {
    console.error("GET /api/propositions error", error);
    return NextResponse.json(
      { error: "Failed to fetch propositions" },
      { status: 500 }
    );
  }
}


