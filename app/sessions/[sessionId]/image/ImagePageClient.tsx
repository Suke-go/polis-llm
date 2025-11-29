"use client";

import { useState } from "react";
import type { Story } from "@prisma/client";
import { PrevNextNav } from "../StepNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import clsx from "clsx";

interface ImagePageClientProps {
  sessionId: string;
  initialStory: Story | null;
}

type StepStatus = "not_started" | "generated" | "approved";

export default function ImagePageClient({
  sessionId,
  initialStory,
}: ImagePageClientProps) {
  const [story, setStory] = useState<Story | null>(initialStory);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const imageStatus: StepStatus = story
    ? story.status_image_generated
      ? "approved"
      : story.status_story_approved
      ? "generated" // Using 'generated' to mean ready to generate or generated? Original logic seemed a bit odd but I'll stick to it or simplify.
      // Wait, original: status_image_generated ? approved : status_story_approved ? generated : not_started.
      // If story approved, image is ready to be generated (or generated if we check URL). 
      // Actually "generated" in original code implies "ready to generate" or "in progress"? 
      // Let's look at logic: if story approved, it shows "generated" (Amber). If image generated (status_image_generated flag?), it shows "approved" (Emerald).
      // I will keep logic but update visual.
      : "not_started"
    : "not_started";

  async function callApi(url: string, body: any): Promise<any | null> {
    setError(null);
    setLoading(url);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "API error");
      }
      return await res.json();
    } catch (e: any) {
      setError(e.message ?? "API error");
      return null;
    } finally {
      setLoading(null);
    }
  }

  async function handleGenerateImage() {
    const json = await callApi("/api/image/generate", {
      sessionId,
    });
    if (json?.story) {
      setStory(json.story);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-main">画像生成</h2>
          <StatusBadge status={imageStatus} />
        </div>
        <p className="text-sm text-text-sub mb-6">
          承認済みストーリーから代表画像を生成します。
        </p>

        <div className="mb-6">
          <Button
            onClick={handleGenerateImage}
            disabled={
              !story?.status_story_approved || loading === "/api/image/generate"
            }
            variant="primary"
          >
            {loading === "/api/image/generate" ? "生成中..." : "画像を生成"}
          </Button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-surface p-2 min-h-[300px] flex items-center justify-center shadow-inner overflow-hidden relative">
          {story?.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={story.image_url}
              alt="Generated Story Visual"
              className="max-h-full max-w-full rounded-md shadow-lg object-contain transition-transform duration-700 hover:scale-105"
            />
          ) : (
            <div className="text-center">
              <div className="mb-2 w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-2xl">🖼️</span>
              </div>
              <span className="text-sm text-text-muted">
                まだ画像が生成されていません。
              </span>
            </div>
          )}
        </div>
      </Card>

      <PrevNextNav sessionId={sessionId} current="image" />
    </div>
  );
}

function StatusBadge({ status }: { status: StepStatus }) {
  const label =
    status === "not_started"
      ? "未実行"
      : status === "generated"
      ? "準備完了"
      : "生成済み";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "not_started"
          ? "bg-slate-100 text-text-muted"
          : status === "generated"
          ? "bg-secondary/20 text-text-main"
          : "bg-primary/20 text-primary"
      )}
    >
      {label}
    </span>
  );
}
