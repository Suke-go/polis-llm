import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateStoryImage } from "@/lib/googleImage";

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
  if (!story || !story.status_story_approved) {
    return new Response(
      JSON.stringify({ error: "Approved story is required" }),
      { status: 400 }
    );
  }

  try {
    const { imageUrl } = await generateStoryImage(story.policy_story_ja);

    const updated = await prisma.story.update({
      where: { sessionId: body.sessionId },
      data: {
        image_url: imageUrl,
        status_image_generated: true
      }
    });

    return Response.json({ story: updated });
  } catch (error) {
    console.error("Image generation error:", error);
    // Even on error, save a placeholder so the UI can show something
    const placeholderUrl =
      "https://via.placeholder.com/800x450.png?text=Image+Generation+Error";
    const updated = await prisma.story.update({
      where: { sessionId: body.sessionId },
      data: {
        image_url: placeholderUrl,
        status_image_generated: true
      }
    });
    return Response.json({ story: updated });
  }
}


