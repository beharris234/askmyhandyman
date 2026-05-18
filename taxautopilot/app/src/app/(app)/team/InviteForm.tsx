"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/invitations";

export function InviteForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ email: string; url: string } | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        const formData = new FormData(e.currentTarget);
        const email = String(formData.get("email") || "");
        startTransition(async () => {
          try {
            const res = await fetch("/api/team/invite", { method: "POST", body: formData });
            const body = await res.json();
            if (!body.ok) {
              setError(body.error || "Failed to invite");
              return;
            }
            setSuccess({ email, url: body.invite_url });
            (e.target as HTMLFormElement).reset();
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to invite");
          }
        });
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_140px] gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="teammate@yourtaxoffice.com"
          className="px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none text-[var(--navy-900)] text-sm"
        />
        <select
          name="role"
          defaultValue="preparer"
          className="px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none bg-white text-[var(--navy-900)] text-sm"
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="bg-[var(--navy-900)] text-white font-bold rounded-lg hover:bg-[var(--green-600)] transition disabled:opacity-60 text-sm"
        >
          {pending ? "Sending…" : "Send Invite"}
        </button>
      </div>

      <div className="text-xs text-[var(--text-muted)]">
        💡 <strong>Owner:</strong> {ROLE_DESCRIPTIONS.owner}{" "}
        <strong>Admin:</strong> {ROLE_DESCRIPTIONS.admin}{" "}
        <strong>Preparer:</strong> {ROLE_DESCRIPTIONS.preparer}
      </div>

      {error && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {success && (
        <div className="text-xs bg-[var(--green-100)] border border-[var(--green-500)]/30 rounded-lg p-3">
          <div className="font-semibold text-[var(--green-600)] mb-1">
            ✓ Invitation created for {success.email}
          </div>
          <div className="text-[var(--text-muted)] mb-2">
            Send them this link (transactional email coming soon — for now, paste it in a message):
          </div>
          <code className="block font-mono text-[10px] text-[var(--navy-900)] bg-white rounded p-2 break-all border border-slate-200">
            {success.url}
          </code>
        </div>
      )}
    </form>
  );
}
