"use client";

import { useState, useTransition } from "react";

export function LoginForm({
  action,
  next,
  initialError,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  next?: string;
  initialError?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError ?? null);

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
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <Field label="Password" name="password" type="password" required autoComplete="current-password" />

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
        {pending ? "Signing in…" : "Sign In →"}
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
