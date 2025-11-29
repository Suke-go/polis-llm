"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const steps = [
  { id: "story", label: "1. ストーリー" },
  { id: "image", label: "2. 画像" },
  { id: "propositions", label: "3. 日本語命題" },
  { id: "aps", label: "4. APS" }
];

export function StepNav({ sessionId }: { sessionId: string }) {
  const pathname = usePathname();
  const current = steps.find((step) => pathname?.endsWith(`/${step.id}`));

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs">
      {steps.map((step, index) => {
        const href = `/sessions/${sessionId}/${step.id}`;
        const isActive = current?.id === step.id;
        return (
          <Link
            key={step.id}
            href={href}
            className={clsx(
              "rounded-full border px-3 py-1",
              isActive
                ? "border-sky-400 bg-sky-500 text-slate-950"
                : "border-slate-700 bg-slate-900 text-slate-200 hover:border-sky-400"
            )}
          >
            <span className="mr-1 text-[10px] text-slate-300">
              {index + 1}
            </span>
            {step.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function PrevNextNav({
  sessionId,
  current
}: {
  sessionId: string;
  current: "story" | "image" | "propositions" | "aps";
}) {
  const currentIndex = steps.findIndex((s) => s.id === current);
  const prev = currentIndex > 0 ? steps[currentIndex - 1] : null;
  const next = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;

  return (
    <div className="mt-4 flex justify-between text-xs">
      {prev ? (
        <Link
          href={`/sessions/${sessionId}/${prev.id}`}
          className="rounded-full border border-slate-600 px-3 py-1 text-slate-200 hover:border-sky-400"
        >
          ← {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/sessions/${sessionId}/${next.id}`}
          className="rounded-full border border-sky-400 bg-sky-500 px-3 py-1 text-slate-950 hover:bg-sky-400"
        >
          {next.label} →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}


