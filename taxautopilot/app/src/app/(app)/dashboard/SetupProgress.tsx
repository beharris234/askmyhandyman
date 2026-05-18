"use client";

import Link from "next/link";
import { useState } from "react";
import type { SetupStep } from "@/lib/onboarding";

export function SetupProgress({
  steps,
  initialDismissed,
}: {
  steps: SetupStep[];
  initialDismissed: boolean;
}) {
  const done = steps.filter((s) => s.done).length;
  const total = steps.length;
  const percent = Math.round((done / total) * 100);
  const complete = percent === 100;
  const [dismissed, setDismissed] = useState(initialDismissed || complete);
  const [expanded, setExpanded] = useState(true);

  if (dismissed) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-6 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 p-5 hover:bg-slate-50 transition"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-xs uppercase font-bold tracking-wider text-[var(--green-600)]">
              Setup progress
            </div>
            <span className="text-xs font-bold text-[var(--navy-900)]">
              {done} of {total} complete · {percent}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--green-500)] to-[var(--gold)] transition-all"
              style={{ width: `${Math.max(percent, 3)}%` }}
            />
          </div>
        </div>
        <span className="text-[var(--text-muted)] text-sm shrink-0">{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Steps */}
      {expanded && (
        <div className="p-5 pt-0 space-y-2">
          {steps.map((s) => (
            <StepRow key={s.key} step={s} />
          ))}

          {percent < 100 && (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="block mx-auto mt-4 text-xs text-[var(--text-muted)] hover:text-[var(--navy-900)] underline"
            >
              Hide this (I&apos;ll set up later)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StepRow({ step }: { step: SetupStep }) {
  return (
    <Link
      href={step.href}
      className={`flex items-center justify-between gap-3 p-3 rounded-lg border-2 transition group ${
        step.done
          ? "bg-[var(--green-100)]/30 border-[var(--green-500)]/30"
          : "bg-white border-slate-200 hover:border-[var(--green-500)]"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            step.done
              ? "bg-[var(--green-500)] text-white"
              : "bg-slate-100 text-slate-400 border border-slate-200"
          }`}
        >
          {step.done ? "✓" : ""}
        </div>
        <div className="min-w-0">
          <div className={`font-semibold text-sm truncate ${step.done ? "text-[var(--text-muted)]" : "text-[var(--navy-900)]"}`}>
            {step.title}
            {step.optional && !step.done && (
              <span className="ml-2 text-[10px] font-normal text-[var(--text-light)]">(optional)</span>
            )}
          </div>
          <div className="text-xs text-[var(--text-muted)] truncate">{step.description}</div>
        </div>
      </div>
      <span
        className={`text-xs font-bold shrink-0 ${
          step.done ? "text-[var(--text-muted)]" : "text-[var(--green-600)] group-hover:text-[var(--green-500)]"
        }`}
      >
        {step.ctaLabel}
      </span>
    </Link>
  );
}
