"use client";

import { useState } from "react";

export function CopyLinkButtons({
  referralUrl,
  referralCode,
  officeName,
}: {
  referralUrl: string;
  referralCode: string;
  officeName: string;
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  function copy(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  const emailSubject = encodeURIComponent(
    `Saw something you'd want to know about — TaxAutopilot`
  );
  const emailBody = encodeURIComponent(
    `Hey,\n\nBeen using TaxAutopilot for my tax office and figured you'd want to see it. It's an AI that reads client emails, files docs automatically, drafts replies, tracks refund status, and auto-texts clients along the way.\n\nIf you sign up through my link, you get $250 off your first year:\n${referralUrl}\n\nHappy to walk you through it on a call if you want.\n\n— ${officeName}`
  );
  const smsBody = encodeURIComponent(
    `Hey — been using TaxAutopilot AI for my tax office, thought you'd want to check it out. $250 off if you sign up through this link: ${referralUrl}`
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-stretch">
        <input
          readOnly
          value={referralUrl}
          className="flex-1 px-4 py-3 rounded-lg border-2 border-slate-200 bg-slate-50 text-sm font-mono text-[var(--navy-900)] outline-none"
          onFocus={(e) => e.target.select()}
        />
        <button
          onClick={() => copy(referralUrl, setCopiedLink)}
          className={`px-5 font-bold text-sm rounded-lg transition shrink-0 ${
            copiedLink
              ? "bg-[var(--green-500)] text-white"
              : "bg-[var(--navy-900)] text-white hover:bg-[var(--green-600)]"
          }`}
        >
          {copiedLink ? "✓ Copied" : "Copy Link"}
        </button>
      </div>

      <div className="flex gap-2 items-center text-xs">
        <span className="text-[var(--text-muted)]">Your code:</span>
        <code className="font-mono font-bold text-[var(--navy-900)] bg-slate-100 px-2 py-1 rounded">
          {referralCode}
        </code>
        <button
          onClick={() => copy(referralCode, setCopiedCode)}
          className="text-[var(--green-600)] font-semibold hover:underline"
        >
          {copiedCode ? "✓ Copied" : "Copy code"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        <a
          href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
          className="flex items-center justify-center gap-2 text-sm font-bold px-4 py-2.5 rounded-lg border-2 border-slate-200 hover:border-[var(--green-500)] text-[var(--navy-900)] transition"
        >
          📧 Share via Email
        </a>
        <a
          href={`sms:?body=${smsBody}`}
          className="flex items-center justify-center gap-2 text-sm font-bold px-4 py-2.5 rounded-lg border-2 border-slate-200 hover:border-[var(--green-500)] text-[var(--navy-900)] transition"
        >
          📱 Share via Text
        </a>
      </div>
    </div>
  );
}
