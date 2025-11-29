"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export type Phase = "setup" | "discuss" | "analyze";

const phases = [
  {
    id: "setup" as Phase,
    label: "Phase 1: 課題を設定する",
    description: "ストーリー生成・画像・命題作成",
    paths: ["/story", "/image", "/propositions", "/aps"],
    color: "primary", // Purple
  },
  {
    id: "discuss" as Phase,
    label: "Phase 2: 議論に参加する",
    description: "命題選択・投票",
    paths: ["/tiles", "/vote"],
    color: "accent", // Red
  },
  {
    id: "analyze" as Phase,
    label: "Phase 3: 議論の内容を分析する",
    description: "投票結果の可視化",
    paths: ["/results"],
    color: "secondary", // Yellow
  },
];

export function PhaseNav({ sessionId }: { sessionId: string }) {
  const pathname = usePathname();

  const currentPhase = phases.find((phase) =>
    phase.paths.some((path) => pathname?.includes(path))
  );

  const currentPhaseIndex = currentPhase ? phases.indexOf(currentPhase) : -1;

  return (
    <nav className="mb-8 rounded-xl border border-slate-100 bg-white/50 backdrop-blur-sm p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        {phases.map((phase, index) => {
          const isActive = currentPhase?.id === phase.id;
          const isCompleted = currentPhaseIndex >= 0 && currentPhaseIndex > index;

          // フェーズ1の最後のページ（APS）へのリンク
          const phase1Link = `/sessions/${sessionId}/aps`;
          // フェーズ2の最初のページ（tiles）へのリンク
          const phase2Link = `/sessions/${sessionId}/tiles`;
          // フェーズ3のページ（results）へのリンク
          const phase3Link = `/sessions/${sessionId}/results`;

          const href =
            phase.id === "setup"
              ? phase1Link
              : phase.id === "discuss"
              ? phase2Link
              : phase3Link;

          return (
            <Link
              key={phase.id}
              href={href}
              className={clsx(
                "flex-1 rounded-lg border px-4 py-3 text-sm transition-all duration-300",
                isActive
                  ? "border-primary bg-primary/5 shadow-inner"
                  : isCompleted
                  ? "border-secondary/50 bg-secondary/5 hover:bg-secondary/10"
                  : "border-transparent bg-transparent hover:bg-slate-50 text-text-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={clsx(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : isCompleted
                      ? "bg-secondary text-text-main"
                      : "bg-slate-100 text-text-muted"
                  )}
                >
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div
                    className={clsx(
                      "font-bold font-sans",
                      isActive ? "text-primary" : "text-text-main"
                    )}
                  >
                    {phase.label}
                  </div>
                  <div className="text-xs text-text-sub opacity-80 mt-0.5">
                    {phase.description}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function getCurrentPhase(pathname: string | null): Phase | null {
  if (!pathname) return null;

  const phase = phases.find((phase) =>
    phase.paths.some((path) => pathname.includes(path))
  );

  return phase?.id ?? null;
}
