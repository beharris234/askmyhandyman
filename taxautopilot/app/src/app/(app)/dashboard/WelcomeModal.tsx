"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function WelcomeModal({
  firstName,
  officeName,
  referralCode,
  appUrl,
}: {
  firstName: string;
  officeName: string;
  referralCode: string;
  appUrl: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [pending, startTransition] = useTransition();

  function dismiss() {
    setOpen(false);
    startTransition(async () => {
      await fetch("/api/profile/onboarded", { method: "POST" });
      router.refresh();
    });
  }

  if (!open) return null;

  const referralUrl = `${appUrl}/signup?ref=${referralCode}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-[var(--navy-900)] to-[var(--navy-700)] text-white p-6 rounded-t-2xl">
          <div className="text-3xl mb-2">🚀</div>
          <h1 className="text-2xl font-extrabold">Welcome, {firstName}!</h1>
          <p className="text-white/80 text-sm mt-1">
            {officeName} is now on TaxAutopilot. Here&apos;s the lay of the land.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Quick wins */}
          <div>
            <h3 className="font-bold text-[var(--navy-900)] mb-3">Your first week — 4 quick wins</h3>
            <ol className="space-y-3">
              <Step n={1} title="Import your client list" sub="Bulk upload via CSV from your tax software (Clients → Import)" />
              <Step n={2} title="Connect an inbox" sub="Gmail, Outlook, or any IMAP — Settings → Connect" />
              <Step n={3} title="Try the AI extractor" sub="Drop a real W-2 photo on /demo — see the magic" />
              <Step n={4} title="Invite your team" sub="Each preparer gets their own dashboard, inbox, and SMS line" />
            </ol>
          </div>

          {/* Referral spotlight */}
          <div className="rounded-xl bg-gradient-to-r from-[var(--green-100)] to-amber-50 border border-[var(--green-500)]/30 p-4">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--green-600)] mb-1">
              🎁 Earn your subscription back
            </div>
            <div className="font-bold text-[var(--navy-900)] mb-1">
              $250 credit per referral. Refer 10 = free year.
            </div>
            <div className="text-xs text-[var(--text-muted)] mb-2">Your code:</div>
            <div className="bg-white rounded-md p-2 border border-slate-200 font-mono text-sm font-bold text-[var(--navy-900)]">
              {referralCode}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono break-all">
              {referralUrl}
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/clients/import"
              onClick={dismiss}
              className="flex-1 text-center bg-[var(--navy-900)] text-white font-bold py-2.5 rounded-lg hover:bg-[var(--green-600)] transition text-sm"
            >
              Import Clients →
            </Link>
            <button
              onClick={dismiss}
              disabled={pending}
              className="bg-white border-2 border-slate-200 text-[var(--text-muted)] font-bold px-4 py-2.5 rounded-lg hover:border-slate-300 transition text-sm"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-[var(--navy-100)] flex items-center justify-center font-bold text-[var(--navy-900)] text-sm">
        {n}
      </div>
      <div>
        <div className="font-semibold text-[var(--navy-900)] text-sm">{title}</div>
        <div className="text-xs text-[var(--text-muted)]">{sub}</div>
      </div>
    </li>
  );
}
