"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function NewRefundForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const currentYear = String(new Date().getFullYear() - 1);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        formData.set("client_id", clientId);
        startTransition(async () => {
          try {
            const res = await fetch("/api/refunds/create", {
              method: "POST",
              body: formData,
            });
            const body = await res.json();
            if (!body.ok) {
              setError(body.error || "Failed to create");
              return;
            }
            router.refresh();
            (e.target as HTMLFormElement).reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed");
          }
        });
      }}
    >
      <Field label="Tax year" name="tax_year" type="text" defaultValue={currentYear} required />
      <Field label="Date filed" name="filed_date" type="date" defaultValue={today} required />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Refund amount" name="refund_amount" type="number" step="0.01" placeholder="0.00" />
        <Field label="Amount owed" name="amount_owed" type="number" step="0.01" placeholder="0.00" />
      </div>

      <label className="block">
        <span className="block text-xs font-semibold text-[var(--navy-900)] mb-1">Filing status</span>
        <select
          name="filing_status"
          className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none bg-white text-[var(--navy-900)] text-sm"
        >
          <option value="">— select —</option>
          <option value="single">Single</option>
          <option value="mfj">Married filing jointly</option>
          <option value="mfs">Married filing separately</option>
          <option value="hoh">Head of household</option>
          <option value="qss">Qualifying surviving spouse</option>
        </select>
      </label>

      <label className="block">
        <span className="block text-xs font-semibold text-[var(--navy-900)] mb-1">Refund method</span>
        <select
          name="refund_method"
          defaultValue="direct_deposit"
          className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none bg-white text-[var(--navy-900)] text-sm"
        >
          <option value="direct_deposit">Direct deposit</option>
          <option value="check">Paper check</option>
        </select>
      </label>

      <Field label="Bank last 4 (optional)" name="bank_last4" type="text" maxLength={4} pattern="[0-9]{4}" placeholder="6789" />

      {error && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[var(--navy-900)] text-white font-bold py-2.5 rounded-lg hover:bg-[var(--green-600)] transition disabled:opacity-60 text-sm"
      >
        {pending ? "Scheduling alerts…" : "Start Tracking →"}
      </button>
      <p className="text-[10px] text-[var(--text-muted)] text-center">
        Schedules SMS alerts on days 0, 3, 14, 21, and 28 after filing.
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
      <span className="block text-xs font-semibold text-[var(--navy-900)] mb-1">{label}</span>
      <input
        {...props}
        className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none text-[var(--navy-900)] text-sm"
      />
    </label>
  );
}
