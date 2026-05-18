"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function TwilioConnectForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            const res = await fetch("/api/twilio/connect", { method: "POST", body: formData });
            const body = await res.json();
            if (!body.ok) {
              setError(body.error || "Failed to connect");
              return;
            }
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Connection failed");
          }
        });
      }}
    >
      <Field
        label="Account SID"
        name="account_sid"
        type="text"
        required
        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      />
      <Field
        label="Auth Token"
        name="auth_token"
        type="password"
        required
        placeholder="Found in your Twilio Console dashboard"
        autoComplete="off"
      />
      <Field
        label="Your Twilio phone number"
        name="phone_number"
        type="tel"
        required
        placeholder="(555) 123-4567 or +15551234567"
      />

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
        {pending ? "Testing & saving…" : "Connect Twilio →"}
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
