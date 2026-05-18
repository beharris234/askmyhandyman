"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DangerZone() {
  const router = useRouter();
  const [pendingDelete, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  function exportData() {
    window.location.href = "/api/account/export";
  }

  function deleteAccount() {
    if (confirmText !== "DELETE") {
      setError("Type DELETE to confirm.");
      return;
    }
    setError(null);
    startDelete(async () => {
      try {
        const res = await fetch("/api/account/delete", { method: "POST" });
        const body = await res.json();
        if (!body.ok) {
          setError(body.error || "Delete failed");
          return;
        }
        router.push("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <button
          onClick={exportData}
          className="bg-white border-2 border-[var(--navy-900)] text-[var(--navy-900)] font-bold px-4 py-2 rounded-lg hover:bg-[var(--navy-900)] hover:text-white transition text-sm"
        >
          📥 Export My Data (JSON)
        </button>
        <p className="text-xs text-[var(--text-muted)] mt-1.5">
          Downloads all your clients, documents, conversations, and refund tracks.
        </p>
      </div>

      <div className="pt-4 border-t border-red-100">
        <details>
          <summary className="cursor-pointer text-sm font-bold text-red-700 hover:text-red-800">
            🗑 Delete my account permanently
          </summary>
          <div className="mt-3 space-y-3">
            <p className="text-xs text-[var(--text-muted)]">
              This will permanently delete your account and{" "}
              <strong className="text-red-700">all data in your office</strong> (if you&apos;re the only
              member). No way to recover. Type <code className="font-mono font-bold">DELETE</code> below to confirm.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-3 py-2 rounded-md border-2 border-red-200 focus:border-red-500 outline-none text-sm font-mono"
            />
            {error && <div className="text-xs text-red-700">{error}</div>}
            <button
              onClick={deleteAccount}
              disabled={pendingDelete || confirmText !== "DELETE"}
              className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm"
            >
              {pendingDelete ? "Deleting…" : "Permanently Delete Account"}
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}
