"use client";

import { useState, useTransition } from "react";
import type { FeatureMeta } from "@/lib/feature-toggles";

export function FeatureToggleRow({
  feature,
  initialOn,
}: {
  feature: FeatureMeta;
  initialOn: boolean;
}) {
  const [on, setOn] = useState(initialOn);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    if (feature.comingSoon) return;
    const newValue = !on;
    setOn(newValue);
    setError(null);
    const formData = new FormData();
    formData.set("feature", feature.key);
    formData.set("enabled", String(newValue));
    startTransition(async () => {
      try {
        const res = await fetch("/api/features/toggle", {
          method: "POST",
          body: formData,
        });
        const body = await res.json();
        if (!body.ok) {
          setOn(!newValue);
          setError(body.error || "Failed to save");
        }
      } catch (err) {
        setOn(!newValue);
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[var(--navy-900)] flex items-center gap-2 flex-wrap">
          {feature.label}
          {feature.comingSoon && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Coming soon
            </span>
          )}
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5">{feature.description}</div>
        {error && <div className="text-xs text-red-700 mt-1">{error}</div>}
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending || feature.comingSoon}
        aria-label={`Toggle ${feature.label}`}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed ${
          on ? "bg-[var(--green-500)]" : "bg-slate-200"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
            on ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
