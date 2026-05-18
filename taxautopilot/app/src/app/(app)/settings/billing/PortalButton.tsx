"use client";

import { useState, useTransition } from "react";

export function PortalButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openPortal() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/portal", { method: "POST" });
        const body = await res.json();
        if (!body.ok || !body.url) {
          setError(body.error || "Portal unavailable");
          return;
        }
        window.location.href = body.url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Portal unavailable");
      }
    });
  }

  return (
    <div>
      <button
        onClick={openPortal}
        disabled={pending}
        className="bg-white border-2 border-[var(--navy-900)] text-[var(--navy-900)] font-bold px-4 py-2 rounded-md hover:bg-[var(--navy-900)] hover:text-white transition disabled:opacity-50 text-sm"
      >
        {pending ? "Loading…" : "Manage subscription"}
      </button>
      {error && <div className="text-xs text-red-700 mt-1">{error}</div>}
    </div>
  );
}
