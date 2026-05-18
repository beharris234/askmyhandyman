"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ImapPreset } from "@/lib/imap";

export function ImapConnectForm({ presets }: { presets: ImapPreset[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [presetId, setPresetId] = useState<string>("gmail");
  const preset = presets.find((p) => p.id === presetId) ?? presets[0];
  const isCustom = presetId === "custom";

  const [host, setHost] = useState(preset.host);
  const [port, setPort] = useState(String(preset.port));
  const [secure, setSecure] = useState(preset.secure);

  function handlePresetChange(id: string) {
    setPresetId(id);
    const p = presets.find((x) => x.id === id);
    if (p) {
      setHost(p.host);
      setPort(String(p.port));
      setSecure(p.secure);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            const res = await fetch("/api/imap/connect", {
              method: "POST",
              body: formData,
            });
            const body = await res.json();
            if (!body.ok) {
              setError(body.error || "Failed to connect");
              return;
            }
            router.push("/settings?connected=" + encodeURIComponent(String(formData.get("email"))));
          } catch (err) {
            setError(err instanceof Error ? err.message : "Connection failed");
          }
        });
      }}
    >
      <label className="block">
        <span className="block text-sm font-semibold text-[var(--navy-900)] mb-1.5">Email provider</span>
        <select
          value={presetId}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none bg-white text-[var(--navy-900)]"
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      {preset.notes && (
        <div className="text-xs text-[var(--text-muted)] -mt-2 bg-slate-50 rounded-lg px-3 py-2">
          💡 {preset.notes}
        </div>
      )}

      <Field label="Email address" name="email" type="email" required placeholder="you@example.com" />
      <Field
        label={isCustom ? "Password" : "Password (or App Password)"}
        name="password"
        type="password"
        required
        autoComplete="off"
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="IMAP server"
          name="host"
          type="text"
          required
          value={host}
          onChange={(e) => setHost((e.target as HTMLInputElement).value)}
          readOnly={!isCustom}
        />
        <Field
          label="Port"
          name="port"
          type="number"
          required
          value={port}
          onChange={(e) => setPort((e.target as HTMLInputElement).value)}
          readOnly={!isCustom}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--navy-900)]">
        <input
          type="checkbox"
          name="secure"
          value="true"
          checked={secure}
          onChange={(e) => setSecure(e.target.checked)}
          disabled={!isCustom}
          className="w-4 h-4 rounded border-2 border-slate-300"
        />
        Use SSL/TLS (recommended)
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
        {pending ? "Testing connection…" : "Connect Inbox →"}
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
        className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none text-[var(--navy-900)] read-only:bg-slate-50 transition"
      />
    </label>
  );
}
