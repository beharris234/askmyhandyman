"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AccountForm({
  initialFullName,
  initialEmail,
}: {
  initialFullName: string;
  initialEmail: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            const res = await fetch("/api/account/update", { method: "POST", body: formData });
            const body = await res.json();
            if (!body.ok) {
              setError(body.error || "Update failed");
              return;
            }
            setSuccess(
              body.email_change_pending
                ? "Saved! Check your inbox to confirm the new email."
                : "Saved!"
            );
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Update failed");
          }
        });
      }}
      className="space-y-4"
    >
      <Field label="Full name" name="full_name" type="text" defaultValue={initialFullName} required />
      <Field
        label="Email"
        name="email"
        type="email"
        defaultValue={initialEmail}
        required
        autoComplete="email"
      />
      <Field
        label="New password (optional)"
        name="password"
        type="password"
        placeholder="Leave blank to keep current password"
        minLength={8}
        autoComplete="new-password"
      />

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-[var(--green-600)] bg-[var(--green-100)] border border-[var(--green-500)]/30 rounded-lg px-3 py-2">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-[var(--navy-900)] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[var(--green-600)] transition disabled:opacity-60 text-sm"
      >
        {pending ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-[var(--navy-900)] mb-1.5">{label}</span>
      <input
        {...props}
        className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none text-[var(--navy-900)] transition"
      />
    </label>
  );
}
