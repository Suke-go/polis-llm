"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { DashboardLink } from "@/components/DashboardLink";

const steps = [
  { id: "story", label: "1. ストーリー" },
  { id: "image", label: "2. 画像" },
  { id: "propositions", label: "3. 日本語命題" },
  { id: "aps", label: "4. APS" },
];

export function StepNav({ sessionId }: { sessionId: string }) {
  const pathname = usePathname();
  const current = steps.find((step) => pathname?.endsWith(`/${step.id}`));

  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm">
      {steps.map((step, index) => {
        const href = `/sessions/${sessionId}/${step.id}`;
        const isActive = current?.id === step.id;
        return (
          <Link
            key={step.id}
            href={href}
            className={clsx(
              "rounded-full border px-4 py-1.5 transition-colors font-medium",
              isActive
                ? "border-primary bg-primary text-white shadow-md"
                : "border-slate-200 bg-white text-text-sub hover:border-primary/50 hover:text-primary"
            )}
          >
            {step.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function PrevNextNav({
  sessionId,
  current,
}: {
  sessionId: string;
  current: "story" | "image" | "propositions" | "aps";
}) {
  const currentIndex = steps.findIndex((s) => s.id === current);
  const prev = currentIndex > 0 ? steps[currentIndex - 1] : null;
  const next = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;

  return (
    <div className="mt-8 flex justify-between items-center border-t border-slate-100 pt-6">
      <div className="flex gap-2">
        <DashboardLink />
        {prev ? (
          <Link href={`/sessions/${sessionId}/${prev.id}`}>
            <Button variant="outline" size="sm">
              ← {prev.label}
            </Button>
          </Link>
        ) : null}
      </div>
      {next ? (
        <Link href={`/sessions/${sessionId}/${next.id}`}>
          <Button variant="primary" size="sm">
            {next.label} →
          </Button>
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
