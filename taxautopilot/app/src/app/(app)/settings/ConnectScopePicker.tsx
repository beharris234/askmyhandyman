"use client";

import { useState } from "react";

export function ConnectScopePicker({
  googleConfigured,
  microsoftConfigured,
  encryptionConfigured,
}: {
  googleConfigured: boolean;
  microsoftConfigured: boolean;
  encryptionConfigured: boolean;
}) {
  const [scope, setScope] = useState<"office" | "personal">("office");

  const providers = [
    {
      key: "gmail",
      emoji: "📧",
      title: "Gmail",
      sub: "Google Workspace or personal",
      href: `/api/google/connect?scope=${scope}`,
      enabled: googleConfigured,
      disabledReason: "Set GOOGLE_CLIENT_ID in .env",
    },
    {
      key: "outlook",
      emoji: "✉️",
      title: "Outlook / Microsoft 365",
      sub: "Personal or work account",
      href: `/api/microsoft/connect?scope=${scope}`,
      enabled: microsoftConfigured,
      disabledReason: "Set MICROSOFT_CLIENT_ID in .env",
    },
    {
      key: "imap",
      emoji: "📬",
      title: "Any Other Email",
      sub: "Yahoo · iCloud · GoDaddy · custom — IMAP",
      href: `/settings/imap?scope=${scope}`,
      enabled: encryptionConfigured,
      disabledReason: "Set ENCRYPTION_KEY (32+ chars) in .env",
    },
  ];

  return (
    <div className="mt-4 mb-5">
      {/* Scope picker */}
      <div className="mb-4 rounded-xl bg-slate-50 p-4 border border-slate-200">
        <div className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] mb-2">
          Connect this inbox as:
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ScopeOption
            active={scope === "office"}
            onClick={() => setScope("office")}
            emoji="🏢"
            title="Office-wide"
            sub="All teammates can see + reply to messages here"
          />
          <ScopeOption
            active={scope === "personal"}
            onClick={() => setScope("personal")}
            emoji="👤"
            title="Just for me"
            sub="Only you see this inbox — for your direct client emails"
          />
        </div>
      </div>

      {/* Provider cards (now scope-aware) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {providers.map((p) => {
          if (!p.enabled) {
            return (
              <div
                key={p.key}
                className="flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 p-4 opacity-60"
              >
                <span className="text-2xl">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[var(--navy-900)]">{p.title}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{p.disabledReason}</div>
                </div>
              </div>
            );
          }
          return (
            <a
              key={p.key}
              href={p.href}
              className="flex items-center gap-3 rounded-xl border-2 border-slate-200 p-4 hover:border-[var(--green-500)] transition group"
            >
              <span className="text-2xl">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[var(--navy-900)] group-hover:text-[var(--green-600)]">
                  {p.title}
                </div>
                <div className="text-xs text-[var(--text-muted)]">{p.sub}</div>
              </div>
              <span className="text-[var(--green-600)] font-bold">→</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function ScopeOption({
  active,
  onClick,
  emoji,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3 rounded-lg border-2 transition ${
        active
          ? "border-[var(--green-500)] bg-white"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="font-bold text-sm text-[var(--navy-900)] mb-0.5">
        {emoji} {title}
      </div>
      <div className="text-xs text-[var(--text-muted)] leading-tight">{sub}</div>
    </button>
  );
}
