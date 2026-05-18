"use client";

import { useState, useTransition } from "react";

export function SyncButton({
  id,
  action,
}: {
  id: string;
  action: (formData: FormData) => Promise<{ error?: string; ok?: boolean; results?: unknown[] } | void>;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  return (
    <form
      action={(formData) => {
        formData.set("id", id);
        setResult(null);
        startTransition(async () => {
          const r = await action(formData);
          if (r) {
            if ("error" in r && r.error) setResult(`Error: ${r.error}`);
            else if ("results" in r && Array.isArray(r.results) && r.results[0]) {
              const first = r.results[0] as {
                processed?: number;
                documents_extracted?: number;
                skipped?: number;
              };
              setResult(
                `✓ ${first.processed ?? 0} new, ${first.documents_extracted ?? 0} docs extracted`
              );
            } else setResult("✓ Synced");
          }
        });
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-bold px-3 py-1.5 rounded-md bg-[var(--navy-900)] text-white hover:bg-[var(--green-600)] transition disabled:opacity-50"
      >
        {pending ? "Syncing…" : "Sync now"}
      </button>
      {result && (
        <div className="text-[10px] text-[var(--text-muted)] mt-1 text-right">{result}</div>
      )}
    </form>
  );
}

export function DisconnectButton({
  id,
  action,
}: {
  id: string;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        if (!confirm("Disconnect this inbox? We'll stop processing new emails from it.")) return;
        formData.set("id", id);
        startTransition(async () => {
          await action(formData);
        });
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-bold px-3 py-1.5 rounded-md border border-slate-300 text-[var(--text-muted)] hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition disabled:opacity-50"
      >
        {pending ? "…" : "Disconnect"}
      </button>
    </form>
  );
}
