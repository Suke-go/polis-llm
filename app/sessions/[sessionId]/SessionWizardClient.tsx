"use client";

import { useState } from "react";
import type { Story, Proposition } from "@prisma/client";

interface SessionWizardClientProps {
  session: {
    id: string;
    title: string;
    prompt: string;
  };
  story: Story | null;
  propositions: Proposition[];
}

type StepStatus = "not_started" | "generated" | "approved";

export default function SessionWizardClient({
  session,
  story: initialStory,
  propositions: initialPropositions
}: SessionWizardClientProps) {
  const [story, setStory] = useState<Story | null>(initialStory);
  const [propsState, setPropsState] =
    useState<Proposition[]>(initialPropositions);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const storyStatus: StepStatus = story
    ? story.status_story_approved
      ? "approved"
      : "generated"
    : "not_started";
  const imageStatus: StepStatus = story
    ? story.status_image_generated
      ? "approved"
      : story.status_story_approved
      ? "generated"
      : "not_started"
    : "not_started";
  const editApproved = propsState.some((p) => p.status_edit_approved);
  const apsApproved = propsState.some((p) => p.status_aps_approved);

  async function callApi(
    url: string,
    body: any
  ): Promise<any | null> {
    setError(null);
    setLoading(url);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
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
      sessionId: session.id
    });
    if (json?.story) {
      setStory(json.story);
    }
  }

  async function handleApproveStory() {
    const json = await callApi("/api/story/approve", {
      sessionId: session.id
    });
    if (json?.story) {
      setStory(json.story);
    }
  }

  async function handleGenerateImage() {
    const json = await callApi("/api/image/generate", {
      sessionId: session.id
    });
    if (json?.story) {
      setStory(json.story);
    }
  }

  async function handleGeneratePropositions() {
    const json = await callApi("/api/propositions/generate", {
      sessionId: session.id
    });
    if (json?.propositions) {
      setPropsState(json.propositions);
    }
  }

  async function handleApproveEdit() {
    const editedItems = propsState.map((p) => ({
      id: p.id,
      ja_text: p.ja_text
    }));
    const json = await callApi("/api/propositions/approve-edit", {
      sessionId: session.id,
      editedItems
    });
    if (json?.propositions) {
      setPropsState(json.propositions);
    }
  }

  async function handleRunAps() {
    const json = await callApi("/api/propositions/aps", {
      sessionId: session.id
    });
    if (json?.propositions) {
      setPropsState(json.propositions);
    }
  }

  async function handleApproveAps() {
    const json = await callApi("/api/propositions/approve-aps", {
      sessionId: session.id
    });
    if (json?.propositions) {
      setPropsState(json.propositions);
    }
  }

  function updateJaText(id: string, value: string) {
    setPropsState((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ja_text: value } : p))
    );
  }

  function addProposition() {
    const tempId = `temp-${Date.now()}`;
    setPropsState((prev) => [
      ...prev,
      {
        id: tempId,
        sessionId: session.id,
        ja_text: "",
        en_text: null,
        back_translated_ja: null,
        translation_diff_score: null,
        status_edit_approved: false,
        status_aps_approved: false
      }
    ]);
  }

  function removeProposition(id: string) {
    setPropsState((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <main className="space-y-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="text-lg font-semibold mb-1">{session.title}</h2>
        <p className="text-xs text-slate-400 mb-2">セッションID: {session.id}</p>
        <p className="text-sm whitespace-pre-wrap text-slate-200">
          {session.prompt}
        </p>
      </section>

      {error && (
        <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Step 1: Story */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <header className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">1. ストーリー生成 & 明文化</h3>
              <p className="text-xs text-slate-400">
                プロンプトから SF ストーリーと明文化版を生成し、承認します。
              </p>
            </div>
            <StatusBadge status={storyStatus} />
          </header>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={handleGenerateStory}
              disabled={loading === "/api/story/generate"}
              className="rounded-full bg-sky-500 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
            >
              {loading === "/api/story/generate" ? "生成中..." : "ストーリー生成"}
            </button>
            <button
              onClick={handleApproveStory}
              disabled={!story || story.status_story_approved || loading === "/api/story/approve"}
              className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {story?.status_story_approved ? "承認済み" : "明文化ストーリーを承認"}
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <p className="font-semibold text-slate-300">SFストーリー（日本語）</p>
            <div className="rounded-md border border-slate-800 bg-slate-950/50 p-2 h-32 overflow-auto">
              {story?.sf_story_ja ?? (
                <span className="text-slate-500">まだ生成されていません。</span>
              )}
            </div>
            <p className="font-semibold text-slate-300 mt-2">
              明文化ストーリー（日本語）
            </p>
            <div className="rounded-md border border-slate-800 bg-slate-950/50 p-2 h-32 overflow-auto">
              {story?.policy_story_ja ?? (
                <span className="text-slate-500">まだ生成されていません。</span>
              )}
            </div>
          </div>
        </section>

        {/* Step 2: Image */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <header className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">2. 画像生成</h3>
              <p className="text-xs text-slate-400">
                承認済みストーリーから代表画像を生成します。
              </p>
            </div>
            <StatusBadge status={imageStatus} />
          </header>
          <button
            onClick={handleGenerateImage}
            disabled={
              !story?.status_story_approved ||
              loading === "/api/image/generate"
            }
            className="mb-3 rounded-full bg-sky-500 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
          >
            {loading === "/api/image/generate" ? "生成中..." : "画像を生成"}
          </button>
          <div className="rounded-md border border-slate-800 bg-slate-950/50 p-2 h-64 flex items-center justify-center">
            {story?.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={story.image_url}
                alt="Story"
                className="max-h-full max-w-full rounded-md"
              />
            ) : (
              <span className="text-xs text-slate-500">
                まだ画像が生成されていません。
              </span>
            )}
          </div>
        </section>

        {/* Step 3: Japanese propositions */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 md:col-span-2">
          <header className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">
                3. 日本語命題の生成・編集・承認
              </h3>
              <p className="text-xs text-slate-400">
                ストーリーから議論しやすい命題リストを生成し、編集して承認します。
              </p>
            </div>
            <StatusBadge
              status={
                propsState.length === 0
                  ? "not_started"
                  : editApproved
                  ? "approved"
                  : "generated"
              }
            />
          </header>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={handleGeneratePropositions}
              disabled={loading === "/api/propositions/generate"}
              className="rounded-full bg-sky-500 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
            >
              {loading === "/api/propositions/generate"
                ? "生成中..."
                : "命題を生成"}
            </button>
            <button
              onClick={addProposition}
              className="rounded-full border border-slate-600 px-3 py-1 text-xs font-medium text-slate-200 hover:border-sky-400"
            >
              命題を追加
            </button>
            <button
              onClick={handleApproveEdit}
              disabled={
                propsState.length === 0 ||
                loading === "/api/propositions/approve-edit"
              }
              className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {editApproved ? "編集済み命題を再承認" : "命題リストを承認"}
            </button>
          </div>
          <div className="grid gap-2 md:grid-cols-2 max-h-72 overflow-auto pr-1">
            {propsState.length === 0 ? (
              <p className="text-xs text-slate-500">
                まだ命題が生成されていません。
              </p>
            ) : (
              propsState.map((p, idx) => (
                <div
                  key={p.id}
                  className="rounded-md border border-slate-800 bg-slate-950/60 p-2 space-y-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-slate-400">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeProposition(p.id)}
                      className="text-[10px] text-slate-400 hover:text-red-300"
                    >
                      削除
                    </button>
                  </div>
                  <textarea
                    className="w-full rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs outline-none focus:border-sky-500"
                    rows={3}
                    value={p.ja_text}
                    onChange={(e) => updateJaText(p.id, e.target.value)}
                  />
                </div>
              ))
            )}
          </div>
        </section>

        {/* Step 4: APS */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 md:col-span-2">
          <header className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">
                4. 翻訳・APS・再翻訳の実行と承認
              </h3>
              <p className="text-xs text-slate-400">
                日本語命題を英訳し、Gemma-APS で命題分割 → 再翻訳して確認・承認します。
              </p>
            </div>
            <StatusBadge
              status={
                !editApproved
                  ? "not_started"
                  : apsApproved
                  ? "approved"
                  : "generated"
              }
            />
          </header>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={handleRunAps}
              disabled={
                !editApproved || loading === "/api/propositions/aps"
              }
              className="rounded-full bg-sky-500 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
            >
              {loading === "/api/propositions/aps"
                ? "実行中..."
                : "翻訳・APS・再翻訳を実行"}
            </button>
            <button
              onClick={handleApproveAps}
              disabled={
                propsState.length === 0 ||
                loading === "/api/propositions/approve-aps"
              }
              className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {apsApproved ? "APS結果を再承認" : "APS結果を承認"}
            </button>
          </div>
          <div className="grid gap-2 md:grid-cols-3 max-h-80 overflow-auto pr-1 text-[11px]">
            {propsState.length === 0 ? (
              <p className="text-slate-500">
                まだ APS 結果がありません（先に命題生成と承認を行ってください）。
              </p>
            ) : (
              propsState.map((p, idx) => (
                <div
                  key={p.id}
                  className="rounded-md border border-slate-800 bg-slate-950/60 p-2 space-y-1"
                >
                  <div className="text-[10px] text-slate-400 mb-1">
                    命題 #{idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-300 mb-0.5">
                      英文命題
                    </p>
                    <p className="rounded border border-slate-800 bg-slate-900 px-2 py-1">
                      {p.en_text ?? (
                        <span className="text-slate-600">なし</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-300 mb-0.5">
                      再翻訳（日本語）
                    </p>
                    <p className="rounded border border-slate-800 bg-slate-900 px-2 py-1">
                      {p.back_translated_ja ?? (
                        <span className="text-slate-600">なし</span>
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Final summary */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold mb-2">
          最終アウトプット（このセッションの現状）
        </h3>
        <ul className="space-y-1 text-xs text-slate-300">
          <li>
            ・ストーリー:{" "}
            <span className="font-mono">
              {storyStatus === "approved"
                ? "承認済み"
                : storyStatus === "generated"
                ? "生成済み（未承認）"
                : "未生成"}
            </span>
          </li>
          <li>
            ・画像:{" "}
            <span className="font-mono">
              {imageStatus === "approved"
                ? "生成済み"
                : story?.status_story_approved
                ? "生成可能（未実行）"
                : "未生成"}
            </span>
          </li>
          <li>
            ・日本語命題:{" "}
            <span className="font-mono">
              {propsState.length === 0
                ? "なし"
                : editApproved
                ? `承認済み (${propsState.length} 件)`
                : `編集中 (${propsState.length} 件)`}
            </span>
          </li>
          <li>
            ・APS結果:{" "}
            <span className="font-mono">
              {apsApproved
                ? "承認済み"
                : propsState.some((p) => p.en_text || p.back_translated_ja)
                ? "結果あり（未承認）"
                : "未実行"}
            </span>
          </li>
        </ul>
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: StepStatus }) {
  const label =
    status === "not_started"
      ? "未実行"
      : status === "generated"
      ? "実行済み"
      : "承認済み";
  const color =
    status === "not_started"
      ? "bg-slate-700 text-slate-200"
      : status === "generated"
      ? "bg-amber-500/90 text-slate-950"
      : "bg-emerald-500 text-slate-950";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}
    >
      {label}
    </span>
  );
}


