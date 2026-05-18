"use client";

import { useState, useTransition } from "react";

export function NewClientForm({
  action,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await action(formData);
          if (result && "error" in result && result.error) setError(result.error);
        });
      }}
      className="space-y-4"
    >
      <Field label="Full name" name="full_name" type="text" required placeholder="Jane Doe" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email" name="email" type="email" placeholder="jane@example.com" />
        <Field label="Phone" name="phone" type="tel" placeholder="(555) 123-4567" />
      </div>
      <Field
        label="SSN (last 4)"
        name="ssn_last4"
        type="text"
        placeholder="6789"
        maxLength={4}
        pattern="[0-9]{4}"
      />

      <label className="block">
        <span className="block text-sm font-semibold text-[var(--navy-900)] mb-1.5">Notes</span>
        <textarea
          name="notes"
          rows={3}
          placeholder="Anything you want to remember about this client…"
          className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none text-[var(--navy-900)] transition resize-none"
        />
      </label>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[var(--navy-900)] text-white font-bold py-3 rounded-lg hover:bg-[var(--green-600)] transition disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add Client →"}
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
