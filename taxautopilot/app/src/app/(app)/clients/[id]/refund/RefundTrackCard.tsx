"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Track = {
  id: string;
  tax_year: string;
  filed_date: string;
  refund_amount: string | null;
  amount_owed: string | null;
  current_status: string;
  expected_acceptance_date: string | null;
  expected_refund_date: string | null;
  refund_method: string;
};

type Scheduled = {
  id: string;
  template_id: string;
  body: string;
  scheduled_for: string;
  status: string;
  sent_at: string | null;
  skip_reason: string | null;
};

const STATUS_FLOW = [
  { key: "filed", label: "Filed" },
  { key: "accepted", label: "Accepted" },
  { key: "processing", label: "Processing" },
  { key: "refund_approved", label: "Approved" },
  { key: "refund_sent", label: "Refund Sent" },
  { key: "received", label: "Received" },
];

const STATUS_BUTTONS = [
  { key: "accepted", label: "IRS Accepted", tone: "green" },
  { key: "rejected", label: "IRS Rejected", tone: "red" },
  { key: "refund_sent", label: "Refund Released", tone: "green" },
  { key: "received", label: "Client got it!", tone: "green" },
  { key: "issue", label: "There's an Issue", tone: "amber" },
];

export function RefundTrackCard({ track, schedule }: { track: Track; schedule: Scheduled[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function updateStatus(newStatus: string) {
    if (newStatus === track.current_status) return;
    setError(null);
    const formData = new FormData();
    formData.set("status", newStatus);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/refunds/${track.id}/update`, {
          method: "POST",
          body: formData,
        });
        const body = await res.json();
        if (!body.ok) {
          setError(body.error || "Update failed");
          return;
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  const currentIdx = STATUS_FLOW.findIndex((s) => s.key === track.current_status);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--navy-900)] text-white p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--green-500)] font-bold mb-1">
            Tax Year {track.tax_year}
          </div>
          <div className="font-extrabold text-xl">
            {track.refund_amount
              ? `$${parseFloat(track.refund_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} refund`
              : track.amount_owed
              ? `$${parseFloat(track.amount_owed).toLocaleString("en-US", { minimumFractionDigits: 2 })} owed`
              : "Tracking"}
          </div>
          <div className="text-xs text-white/60 mt-0.5">
            Filed {new Date(track.filed_date + "T00:00:00").toLocaleDateString()} · {track.refund_method.replace("_", " ")}
            {track.expected_refund_date &&
              ` · Expected ${new Date(track.expected_refund_date + "T00:00:00").toLocaleDateString()}`}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
          {STATUS_FLOW.map((s, i) => (
            <div key={s.key} className="flex flex-col items-center flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                  i <= currentIdx
                    ? "bg-[var(--green-500)] text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {i <= currentIdx ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1.5 text-center leading-tight ${
                  i === currentIdx ? "text-[var(--navy-900)]" : "text-[var(--text-light)]"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status buttons */}
      <div className="p-5 border-b border-slate-100">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Update status (auto-fires SMS alert)
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_BUTTONS.map((btn) => {
            const active = btn.key === track.current_status;
            const toneCls =
              btn.tone === "green"
                ? active
                  ? "bg-[var(--green-500)] text-white"
                  : "border-[var(--green-500)] text-[var(--green-600)] hover:bg-[var(--green-100)]"
                : btn.tone === "red"
                ? active
                  ? "bg-red-500 text-white"
                  : "border-red-300 text-red-700 hover:bg-red-50"
                : active
                ? "bg-amber-500 text-white"
                : "border-amber-300 text-amber-700 hover:bg-amber-50";
            return (
              <button
                key={btn.key}
                disabled={pending || active}
                onClick={() => updateStatus(btn.key)}
                className={`text-xs font-bold px-3 py-1.5 rounded-md border-2 transition disabled:opacity-50 ${
                  active ? "border-transparent" : ""
                } ${toneCls}`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
        {error && <div className="mt-2 text-xs text-red-700">{error}</div>}
      </div>

      {/* Scheduled messages */}
      <div className="p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Scheduled alerts ({schedule.length})
        </div>
        {schedule.length > 0 ? (
          <div className="space-y-2">
            {schedule.map((s) => (
              <ScheduledRow key={s.id} s={s} />
            ))}
          </div>
        ) : (
          <div className="text-xs text-[var(--text-light)] italic">No alerts scheduled.</div>
        )}
      </div>
    </div>
  );
}

function ScheduledRow({ s }: { s: Scheduled }) {
  const when = new Date(s.scheduled_for);
  const statusCls =
    s.status === "sent"
      ? "bg-[var(--green-100)] text-[var(--green-600)]"
      : s.status === "pending"
      ? "bg-amber-100 text-amber-700"
      : s.status === "skipped"
      ? "bg-slate-100 text-slate-600"
      : "bg-red-100 text-red-700";

  return (
    <div className="border border-slate-200 rounded-lg p-3 text-sm">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-bold text-[var(--navy-900)]">
          {when.toLocaleDateString()}{" "}
          <span className="text-[var(--text-muted)] font-normal">
            · {when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusCls}`}>
          {s.status}
        </span>
      </div>
      <div className="text-[var(--text)] text-sm leading-snug">{s.body}</div>
      {s.skip_reason && (
        <div className="text-[10px] text-[var(--text-light)] mt-1">Skip reason: {s.skip_reason}</div>
      )}
    </div>
  );
}
