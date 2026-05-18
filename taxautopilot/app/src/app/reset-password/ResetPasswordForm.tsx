"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        const password = String(formData.get("password") || "");
        const confirm = String(formData.get("confirm") || "");
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          return;
        }
        if (password !== confirm) {
          setError("Passwords don't match.");
          return;
        }
        startTransition(async () => {
          try {
            const supabase = createClient();
            const { error: err } = await supabase.auth.updateUser({ password });
            if (err) {
              setError(err.message);
              return;
            }
            setDone(true);
            setTimeout(() => router.push("/dashboard"), 1500);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update password");
          }
        });
      }}
      className="space-y-4"
    >
      {done ? (
        <div className="text-sm bg-[var(--green-100)] border border-[var(--green-500)]/30 rounded-lg px-4 py-3">
          <div className="font-bold text-[var(--green-600)] mb-1">✓ Password updated</div>
          <div className="text-[var(--text)]">Redirecting to your dashboard…</div>
        </div>
      ) : (
        <>
          <label className="block">
            <span className="block text-sm font-semibold text-[var(--navy-900)] mb-1.5">New password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none text-[var(--navy-900)] transition"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-semibold text-[var(--navy-900)] mb-1.5">Confirm password</span>
            <input
              name="confirm"
              type="password"
              required
              minLength={8}
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
            {pending ? "Updating…" : "Update Password →"}
          </button>

          <div className="text-xs text-center text-[var(--text-muted)]">
            <Link href="/login" className="hover:underline">Back to login</Link>
          </div>
        </>
      )}
    </form>
  );
}
