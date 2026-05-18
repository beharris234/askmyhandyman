"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-4">⚠️</div>
        <div className="text-xs uppercase font-bold tracking-wider text-red-700 mb-2">
          Something broke
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--navy-900)] mb-3">
          That didn&apos;t go as planned
        </h1>
        <p className="text-[var(--text-muted)] mb-3">
          We hit an unexpected error. Try refreshing — if it persists, hit the 💬 helper or email support.
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-[var(--text-light)] mb-6">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={reset}
            className="bg-[var(--navy-900)] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[var(--green-600)] transition text-sm"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="bg-white border-2 border-slate-200 text-[var(--navy-900)] font-bold px-5 py-2.5 rounded-lg hover:border-slate-300 transition text-sm"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
