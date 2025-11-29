"use client";

import { useState } from "react";
import type { Story } from "@prisma/client";
import { PrevNextNav } from "../StepNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import clsx from "clsx";

interface StoryPageClientProps {
  sessionId: string;
  initialStory: Story | null;
}

type StepStatus = "not_started" | "generated" | "approved";

export default function StoryPageClient({
  sessionId,
  initialStory,
}: StoryPageClientProps) {
  const [story, setStory] = useState<Story | null>(initialStory);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const storyStatus: StepStatus = story
    ? story.status_story_approved
      ? "approved"
      : "generated"
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

  async function handleGenerateStory() {
    const json = await callApi("/api/story/generate", {
      sessionId,
    });
    if (json?.story) {
      setStory(json.story);
    }
  }

  async function handleApproveStory() {
    const json = await callApi("/api/story/approve", {
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
          <h2 className="text-xl font-bold text-text-main">ストーリー生成 & 明文化</h2>
          <StatusBadge status={storyStatus} />
        </div>
        <p className="text-sm text-text-sub mb-6">
          プロンプトから SF ストーリーと明文化版を生成し、承認します。
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          <Button
            onClick={handleGenerateStory}
            disabled={loading === "/api/story/generate"}
            variant="primary"
          >
            {loading === "/api/story/generate" ? "生成中..." : "ストーリー生成"}
          </Button>
          <Button
            onClick={handleApproveStory}
            disabled={
              !story ||
              story.status_story_approved ||
              loading === "/api/story/approve"
            }
            variant="secondary"
          >
            {story?.status_story_approved ? "承認済み" : "明文化ストーリーを承認"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="font-bold text-text-main text-sm">
              SFストーリー（日本語）
            </p>
            <div className="rounded-md border border-slate-200 bg-surface p-4 h-64 overflow-auto text-sm leading-relaxed text-text-sub shadow-inner">
              {story?.sf_story_ja ?? (
                <span className="text-text-muted italic">
                  まだ生成されていません。
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-text-main text-sm">
              明文化ストーリー（日本語）
            </p>
            <div className="rounded-md border border-slate-200 bg-surface p-4 h-64 overflow-auto text-sm leading-relaxed text-text-sub shadow-inner">
              {story?.policy_story_ja ?? (
                <span className="text-text-muted italic">
                  まだ生成されていません。
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <PrevNextNav sessionId={sessionId} current="story" />
    </div>
  );
}

function StatusBadge({ status }: { status: StepStatus }) {
  const label =
    status === "not_started"
      ? "未実行"
      : status === "generated"
      ? "実行済み"
      : "承認済み";

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
