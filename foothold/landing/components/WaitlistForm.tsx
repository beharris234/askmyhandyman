"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const MEDICATIONS = [
  { value: "", label: "I take…  (optional)" },
  { value: "ozempic", label: "Ozempic" },
  { value: "wegovy", label: "Wegovy" },
  { value: "mounjaro", label: "Mounjaro" },
  { value: "zepbound", label: "Zepbound" },
  { value: "rybelsus", label: "Rybelsus" },
  { value: "saxenda", label: "Saxenda" },
  { value: "victoza", label: "Victoza" },
  { value: "compounded", label: "Compounded GLP-1" },
  { value: "considering", label: "Considering one" },
  { value: "other", label: "Other" },
];

const PHASES = [
  { value: "", label: "I'm currently…  (optional)" },
  { value: "considering", label: "Considering starting" },
  { value: "starting", label: "Just started" },
  { value: "titrating", label: "Titrating up" },
  { value: "maintaining", label: "Maintaining a dose" },
  { value: "tapering", label: "Tapering off" },
  { value: "off", label: "Off it now" },
];

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [medication, setMedication] = useState("");
  const [phase, setPhase] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setMessage(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, medication, phase }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setMessage(typeof data.error === "string" ? data.error : "Something went wrong.");
        return;
      }

      setStatus("success");
      setMessage(
        data.deduped
          ? "You're already on the list — we'll be in touch."
          : "You're in. Watch your inbox for early access.",
      );
      setEmail("");
      setMedication("");
      setPhase("");
    } catch {
      setStatus("error");
      setMessage("Network hiccup. Try again in a moment.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-clay/20 bg-moss/60 p-6 text-center">
        <p className="font-display text-2xl text-clay">Welcome aboard.</p>
        <p className="mt-2 text-stone">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="sr-only" htmlFor="wl-email">Email address</label>
      <input
        id="wl-email"
        type="email"
        required
        autoComplete="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input-field"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <select
          aria-label="Current medication"
          value={medication}
          onChange={(e) => setMedication(e.target.value)}
          className="input-field"
        >
          {MEDICATIONS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <select
          aria-label="Current phase"
          value={phase}
          onChange={(e) => setPhase(e.target.value)}
          className="input-field"
        >
          {PHASES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={status === "submitting"} className="btn-primary w-full">
        {status === "submitting" ? "Sending…" : "Get early access"}
      </button>

      {status === "error" && message && (
        <p className="text-center text-sm text-red-700" role="alert">{message}</p>
      )}

      <p className="text-center text-xs text-stone">
        No spam. One welcome email + occasional progress updates. Unsubscribe anytime.
      </p>
    </form>
  );
}
