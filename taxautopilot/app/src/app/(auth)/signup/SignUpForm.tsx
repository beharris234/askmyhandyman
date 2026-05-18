"use client";

import { useState, useTransition } from "react";

const SOFTWARES = [
  { value: "", label: "Select your tax software…" },
  { value: "drake", label: "Drake" },
  { value: "crosslink-online", label: "CrossLink Online" },
  { value: "crosslink-desktop", label: "CrossLink Desktop" },
  { value: "lacerte", label: "Lacerte" },
  { value: "proseries", label: "ProSeries" },
  { value: "ultratax", label: "UltraTax CS" },
  { value: "taxwise", label: "TaxWise" },
  { value: "taxslayer", label: "TaxSlayer Pro" },
  { value: "other", label: "Something else" },
];

export function SignUpForm({
  action,
  initialReferralCode,
  inviteToken,
  inviteEmail,
  isInvite,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  initialReferralCode?: string | null;
  inviteToken?: string | null;
  inviteEmail?: string | null;
  isInvite?: boolean;
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
      {initialReferralCode && (
        <input type="hidden" name="referral_code" value={initialReferralCode} />
      )}
      {inviteToken && <input type="hidden" name="invite_token" value={inviteToken} />}

      <Field label="Your name" name="full_name" type="text" required autoComplete="name" />

      {!isInvite && (
        <>
          <Field
            label="Tax office name"
            name="office_name"
            type="text"
            required
            placeholder="e.g. Johnson Tax Office"
          />

          <label className="block">
            <span className="block text-sm font-semibold text-[var(--navy-900)] mb-1.5">
              Tax software
            </span>
            <select
              name="software"
              className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none text-[var(--navy-900)] bg-white transition"
            >
              {SOFTWARES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      <Field
        label="Work email"
        name="email"
        type="email"
        required
        autoComplete="email"
        defaultValue={inviteEmail || undefined}
        readOnly={!!inviteEmail}
      />
      <Field
        label="Password (8+ characters)"
        name="password"
        type="password"
        required
        autoComplete="new-password"
        minLength={8}
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
        {pending ? "Creating your office…" : "Create my office →"}
      </button>

      <p className="text-xs text-[var(--text-muted)] text-center pt-1">
        By signing up you agree to our terms. No charge until launch — Founders Pricing locks today.
      </p>
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
