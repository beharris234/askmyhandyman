"use client";

import { useState, useRef, useCallback } from "react";
import type { ExtractionResponse, ExtractedDocument } from "@/lib/types";

type Status = "idle" | "uploading" | "done" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractedDocument | null>(null);
  const [meta, setMeta] = useState<{ elapsed_ms: number; tokens: { input: number; output: number } } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setStatus("uploading");
    setError(null);
    setResult(null);
    setMeta(null);
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/extract", { method: "POST", body: formData });
      const body = (await res.json()) as ExtractionResponse;
      if (!body.ok) {
        setError(body.error);
        setStatus("error");
        return;
      }
      setResult(body.data);
      setMeta({ elapsed_ms: body.elapsed_ms, tokens: body.tokens });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setStatus("error");
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setStatus("idle");
    setError(null);
    setResult(null);
    setMeta(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-lg bg-[var(--navy-900)] flex items-center justify-center shadow-md">
              <div className="absolute inset-1.5 rounded-md bg-gradient-to-br from-[var(--green-500)] to-[var(--gold)]" />
              <span className="relative text-white font-extrabold text-sm">T</span>
            </div>
            <div>
              <div className="font-bold text-[var(--navy-900)] tracking-tight">TaxAutopilot</div>
              <div className="text-xs text-[var(--text-muted)]">Document Extraction Engine</div>
            </div>
          </div>
          <div className="text-xs text-[var(--text-muted)] hidden sm:block">Phase 1 · MVP</div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[var(--green-100)] text-[var(--green-600)] px-3 py-1 rounded-full text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 bg-[var(--green-500)] rounded-full animate-pulse" />
            AI Vision · Powered by Claude
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--navy-900)] tracking-tight mb-3">
            Drop a tax doc. Get structured data.
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Upload a W-2, 1099, 1098, K-1, or any tax form. AI reads every box and hands back clean JSON ready to paste into your tax software.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all p-10 text-center bg-white ${
                dragOver
                  ? "border-[var(--green-500)] bg-[var(--green-100)]/40 scale-[1.01]"
                  : "border-slate-300 hover:border-[var(--green-500)] hover:bg-slate-50"
              }`}
            >
              {preview && status !== "idle" ? (
                <div className="space-y-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Uploaded document"
                    className="mx-auto max-h-80 rounded-lg shadow-md border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      reset();
                    }}
                    className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--navy-900)] underline"
                  >
                    Upload a different document
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--navy-100)] flex items-center justify-center text-3xl">
                    📄
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--navy-900)] text-lg">
                      Drop a document here
                    </div>
                    <div className="text-sm text-[var(--text-muted)] mt-1">
                      or click to choose · JPEG, PNG, WebP · up to 10 MB
                    </div>
                  </div>
                  <div className="text-xs text-[var(--text-light)]">
                    Try: W-2, 1099-NEC, 1099-MISC, 1098, K-1, SSA-1099
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>

            {status === "uploading" && (
              <div className="mt-4 flex items-center gap-3 text-[var(--navy-900)]">
                <div className="w-4 h-4 rounded-full border-2 border-[var(--green-500)] border-t-transparent animate-spin" />
                <span className="text-sm font-medium">Extracting fields…</span>
              </div>
            )}

            {status === "error" && error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <strong className="block font-semibold mb-1">Extraction failed</strong>
                {error}
              </div>
            )}
          </section>

          <section>
            {!result && status !== "uploading" && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center h-full flex flex-col items-center justify-center">
                <div className="text-5xl mb-3 opacity-30">⚡</div>
                <div className="text-[var(--text-muted)] text-sm max-w-sm">
                  Extracted fields will appear here.
                  <br />
                  Expect a result in 3–10 seconds depending on document complexity.
                </div>
              </div>
            )}

            {status === "uploading" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 animate-pulse">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-full bg-slate-100 rounded" />
                <div className="h-3 w-5/6 bg-slate-100 rounded" />
                <div className="h-3 w-4/6 bg-slate-100 rounded" />
                <div className="h-3 w-full bg-slate-100 rounded" />
                <div className="h-3 w-3/4 bg-slate-100 rounded" />
              </div>
            )}

            {result && <ResultCard data={result} meta={meta} />}
          </section>
        </div>

        <div className="mt-16 text-center text-xs text-[var(--text-light)]">
          TaxAutopilot Engine · Phase 1 · This is an internal MVP. No data is stored.
        </div>
      </div>
    </main>
  );
}

function ResultCard({
  data,
  meta,
}: {
  data: ExtractedDocument;
  meta: { elapsed_ms: number; tokens: { input: number; output: number } } | null;
}) {
  const [copied, setCopied] = useState(false);

  const copyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidenceColor =
    data.confidence === "high"
      ? "text-[var(--green-600)] bg-[var(--green-100)]"
      : data.confidence === "medium"
      ? "text-amber-700 bg-amber-100"
      : "text-red-700 bg-red-100";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-[var(--navy-900)] text-white p-5 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--green-500)] font-semibold mb-1">
            Extracted
          </div>
          <div className="font-extrabold text-xl">
            {data.document_type}
            {data.tax_year && (
              <span className="text-white/60 font-medium text-base ml-2">· {data.tax_year}</span>
            )}
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${confidenceColor}`}>
          {data.confidence?.toUpperCase()} CONFIDENCE
        </span>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <PartyBlock title="Payer / Employer" party={data.payer} />
          <PartyBlock title="Recipient" party={data.recipient} />
        </div>

        {Object.keys(data.boxes || {}).length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold mb-2">
              Boxes
            </div>
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {Object.entries(data.boxes).map(([box, info]) => (
                <div key={box} className="flex items-center justify-between p-3 text-sm">
                  <div className="flex items-baseline gap-3 flex-1 min-w-0">
                    <span className="text-[var(--gold)] font-bold w-10 shrink-0">{box}</span>
                    <span className="text-[var(--text-muted)] truncate">{info.label}</span>
                  </div>
                  <span className="font-mono font-semibold text-[var(--navy-900)] tabular-nums">
                    {formatValue(info.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.warnings && data.warnings.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="text-xs uppercase tracking-wider text-amber-700 font-bold mb-1.5">
              ⚠ Warnings
            </div>
            <ul className="text-sm text-amber-900 space-y-1 list-disc list-inside">
              {data.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-[var(--text-muted)]">
            {meta && (
              <>
                {(meta.elapsed_ms / 1000).toFixed(1)}s · {meta.tokens.input + meta.tokens.output} tokens
              </>
            )}
          </div>
          <button
            onClick={copyJson}
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
              copied
                ? "bg-[var(--green-500)] text-white"
                : "bg-[var(--navy-900)] text-white hover:bg-[var(--green-600)]"
            }`}
          >
            {copied ? "✓ Copied" : "Copy JSON"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PartyBlock({
  title,
  party,
}: {
  title: string;
  party: { name: string | null; ein_or_ssn: string | null; address: string | null };
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
      <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold mb-1.5">
        {title}
      </div>
      <div className="text-sm font-semibold text-[var(--navy-900)] truncate">
        {party?.name || <span className="text-[var(--text-light)] font-normal">—</span>}
      </div>
      {party?.ein_or_ssn && (
        <div className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
          {party.ein_or_ssn}
        </div>
      )}
      {party?.address && (
        <div className="text-xs text-[var(--text-muted)] mt-1 leading-snug">
          {party.address}
        </div>
      )}
    </div>
  );
}

function formatValue(v: number | string | null): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") {
    return v.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return String(v);
}
