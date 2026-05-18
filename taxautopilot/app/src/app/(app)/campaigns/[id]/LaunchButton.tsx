"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function LaunchButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function launch() {
    if (!confirm("Launch this campaign? AI will generate and queue messages for every recipient.")) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/campaigns/${id}/launch`, { method: "POST" });
        const body = await res.json();
        if (!body.ok) {
          setError(body.error || "Launch failed");
          return;
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Launch failed");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs text-red-700">{error}</span>}
      <button
        onClick={launch}
        disabled={pending}
        className="bg-[var(--green-600)] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[var(--green-500)] transition disabled:opacity-50 text-sm"
      >
        {pending ? "Launching…" : "🚀 Launch Campaign"}
      </button>
    </div>
  );
}
