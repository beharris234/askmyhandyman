"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Result = {
  total_rows: number;
  inserted: number;
  skipped_count: number;
  skipped_sample: { row: number; reason: string }[];
  errors: string[];
};

export function ImportForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function reset() {
    setError(null);
    setResult(null);
    setFileName(null);
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setResult(null);
          const formData = new FormData(e.currentTarget);
          startTransition(async () => {
            try {
              const res = await fetch("/api/clients/import", { method: "POST", body: formData });
              const body = await res.json();
              if (!body.ok) {
                setError(body.error || "Import failed");
                return;
              }
              setResult(body);
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Import failed");
            }
          });
        }}
        className="space-y-4"
      >
        <label className="block">
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
            className="block w-full text-sm text-[var(--navy-900)] file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-2 file:border-[var(--navy-900)] file:bg-white file:text-sm file:font-bold file:text-[var(--navy-900)] hover:file:bg-[var(--navy-900)] hover:file:text-white file:cursor-pointer"
          />
          {fileName && (
            <div className="text-xs text-[var(--text-muted)] mt-2">
              Selected: <code className="font-mono">{fileName}</code>
            </div>
          )}
        </label>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending || !fileName}
          className="w-full bg-[var(--navy-900)] text-white font-bold py-3 rounded-lg hover:bg-[var(--green-600)] transition disabled:opacity-60"
        >
          {pending ? "Importing…" : "Import Clients →"}
        </button>
      </form>

      {result && (
        <div className="mt-6 space-y-3">
          <div className="rounded-xl bg-[var(--green-100)] border border-[var(--green-500)]/30 p-5">
            <div className="text-xs uppercase font-bold tracking-wider text-[var(--green-600)] mb-1">
              ✓ Import complete
            </div>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <Stat label="Total rows" value={result.total_rows} />
              <Stat label="Inserted" value={result.inserted} tone="green" />
              <Stat label="Skipped" value={result.skipped_count} tone="amber" />
            </div>
          </div>

          {result.skipped_sample.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs">
              <div className="font-bold text-amber-900 mb-1">Skipped rows (first 10):</div>
              <ul className="text-amber-800 space-y-0.5">
                {result.skipped_sample.map((s, i) => (
                  <li key={i}>Row {s.row}: {s.reason}</li>
                ))}
              </ul>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs">
              <div className="font-bold text-red-900 mb-1">Batch errors:</div>
              <ul className="text-red-800 space-y-0.5">
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={reset}
              className="text-xs font-bold px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50"
            >
              Import another file
            </button>
            <a
              href="/clients"
              className="text-xs font-bold px-3 py-1.5 rounded-md bg-[var(--navy-900)] text-white hover:bg-[var(--green-600)]"
            >
              View clients →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "navy",
}: {
  label: string;
  value: number;
  tone?: "navy" | "green" | "amber";
}) {
  const cls = {
    navy: "text-[var(--navy-900)]",
    green: "text-[var(--green-600)]",
    amber: "text-amber-700",
  }[tone];
  return (
    <div className="text-center">
      <div className={`text-2xl font-extrabold ${cls}`}>{value}</div>
      <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">{label}</div>
    </div>
  );
}
