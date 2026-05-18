"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        const email = String(formData.get("email") || "").trim();
        if (!email) return;

        startTransition(async () => {
          try {
            const supabase = createClient();
            const appUrl = window.location.origin;
            const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${appUrl}/reset-password`,
            });
            if (err) {
              setError(err.message);
              return;
            }
            setSent(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send reset email");
          }
        });
      }}
      className="space-y-4"
    >
      {sent ? (
        <div className="text-sm bg-[var(--green-100)] border border-[var(--green-500)]/30 rounded-lg px-4 py-3">
          <div className="font-bold text-[var(--green-600)] mb-1">✓ Check your inbox</div>
          <div className="text-[var(--text)]">
            If an account exists for that email, you&apos;ll receive a reset link within a minute.
            Check spam if you don&apos;t see it.
          </div>
        </div>
      ) : (
        <>
          <label className="block">
            <span className="block text-sm font-semibold text-[var(--navy-900)] mb-1.5">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none text-[var(--navy-900)] transition"
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
            {pending ? "Sending…" : "Send Reset Link →"}
          </button>
        </>
      )}
    </form>
  );
}
