"use client";

import { useState } from "react";
import type { Proposition } from "@prisma/client";
import { PrevNextNav } from "../StepNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import clsx from "clsx";

interface PropositionsPageClientProps {
  sessionId: string;
  initialPropositions: Proposition[];
}

type StepStatus = "not_started" | "generated" | "approved";

export default function PropositionsPageClient({
  sessionId,
  initialPropositions,
}: PropositionsPageClientProps) {
  const [propsState, setPropsState] =
    useState<Proposition[]>(initialPropositions);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editApproved = propsState.some((p) => p.status_edit_approved);
  const status: StepStatus =
    propsState.length === 0
      ? "not_started"
      : editApproved
      ? "approved"
      : "generated";

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

  async function handleGeneratePropositions() {
    const json = await callApi("/api/propositions/generate", {
      sessionId,
    });
    if (json?.propositions) {
      setPropsState(json.propositions);
    }
  }

  async function handleApproveEdit() {
    const editedItems = propsState.map((p) => ({
      id: p.id,
      ja_text: p.ja_text,
    }));
    const json = await callApi("/api/propositions/approve-edit", {
      sessionId,
      editedItems,
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
        sessionId,
        ja_text: "",
        en_text: null,
        back_translated_ja: null,
        translation_diff_score: null,
        status_edit_approved: false,
        status_aps_approved: false,
      },
    ]);
  }

  function removeProposition(id: string) {
    setPropsState((prev) => prev.filter((p) => p.id !== id));
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
          <h2 className="text-xl font-bold text-text-main">
            日本語命題の生成・編集・承認
          </h2>
          <StatusBadge status={status} />
        </div>
        <p className="text-sm text-text-sub mb-6">
          ストーリーから議論しやすい命題リストを生成し、編集して承認します。
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            onClick={handleGeneratePropositions}
            disabled={loading === "/api/propositions/generate"}
            variant="primary"
            size="sm"
          >
            {loading === "/api/propositions/generate"
              ? "生成中..."
              : "命題を生成"}
          </Button>
          <Button
            onClick={addProposition}
            variant="outline"
            size="sm"
          >
            命題を追加
          </Button>
          <Button
            onClick={handleApproveEdit}
            disabled={
              propsState.length === 0 ||
              loading === "/api/propositions/approve-edit"
            }
            variant="secondary"
            size="sm"
          >
            {editApproved ? "編集済み命題を再承認" : "命題リストを承認"}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 max-h-[500px] overflow-auto pr-2 custom-scrollbar">
          {propsState.length === 0 ? (
            <p className="text-sm text-text-muted col-span-2 text-center py-8">
              まだ命題が生成されていません。
            </p>
          ) : (
            propsState.map((p, idx) => (
              <div
                key={p.id}
                className="rounded-lg border border-slate-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text-muted">
                    #{idx + 1}{" "}
                    {p.status_edit_approved ? (
                      <span className="text-secondary ml-1">● 承認済</span>
                    ) : (
                      <span className="text-text-muted ml-1">● 未承認</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeProposition(p.id)}
                    className="text-xs text-text-muted hover:text-accent transition-colors"
                  >
                    削除
                  </button>
                </div>
                <textarea
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-text-main outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none shadow-inner"
                  rows={3}
                  value={p.ja_text}
                  onChange={(e) => updateJaText(p.id, e.target.value)}
                  placeholder="命題を入力..."
                />
              </div>
            ))
          )}
        </div>
      </Card>

      <PrevNextNav sessionId={sessionId} current="propositions" />
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
