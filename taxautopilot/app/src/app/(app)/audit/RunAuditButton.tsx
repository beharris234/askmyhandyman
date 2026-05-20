"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RunAuditButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/audit/run", { method: "POST" });
        const body = await res.json();
        if (!body.ok) {
          setError(body.error || "Audit failed");
          return;
        }
        router.push(`/audit/${body.report_id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Audit failed");
      }
    });
  }

  return (
    <div>
      <button
        onClick={run}
        disabled={pending}
        className="bg-gradient-to-br from-[var(--gold)] to-amber-500 text-[var(--navy-900)] font-extrabold px-6 py-3 rounded-lg hover:shadow-lg transition disabled:opacity-60 text-sm"
      >
        {pending ? "Analyzing your data…" : "🔍 Run Money Report →"}
      </button>
      {error && <div className="mt-2 text-xs text-red-300">{error}</div>}
    </div>
  );
}
