"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type SampleRecipient = {
  id: string;
  full_name: string;
  years_lapsed: number | null;
  last_year: number | null;
  has_phone: boolean;
  has_email: boolean;
};

export function NewCampaignWizard() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [previewLoading, startPreview] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("Spring Win-back");
  const [channel, setChannel] = useState<"sms" | "email" | "both">("sms");
  const [lapsedMin, setLapsedMin] = useState("1");
  const [includeArchived, setIncludeArchived] = useState(false);

  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [sampleRecipients, setSampleRecipients] = useState<SampleRecipient[]>([]);

  function previewAudience() {
    setError(null);
    const formData = new FormData();
    formData.set("channel", channel);
    formData.set("lapsed_years_min", lapsedMin);
    formData.set("include_archived", String(includeArchived));
    startPreview(async () => {
      try {
        const res = await fetch("/api/campaigns/preview", { method: "POST", body: formData });
        const body = await res.json();
        if (!body.ok) {
          setError(body.error);
          return;
        }
        setPreviewCount(body.count);
        setSampleRecipients(body.sample || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Preview failed");
      }
    });
  }

  function createAndLaunch() {
    setError(null);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("type", "winback");
    formData.set("channel", channel);
    formData.set("lapsed_years_min", lapsedMin);
    formData.set("include_archived", String(includeArchived));

    startTransition(async () => {
      try {
        const createRes = await fetch("/api/campaigns/create", { method: "POST", body: formData });
        const created = await createRes.json();
        if (!created.ok) {
          setError(created.error);
          return;
        }
        router.push(`/campaigns/${created.campaign_id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Create failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Basics */}
      <Section title="1. Campaign name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none text-[var(--navy-900)]"
          placeholder="Spring 2026 Win-back"
        />
      </Section>

      {/* Channel */}
      <Section title="2. Channel">
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "sms", label: "📱 SMS", sub: "Short. Fast." },
            { value: "email", label: "📧 Email", sub: "Longer. More detail." },
            { value: "both", label: "📱 + 📧 Both", sub: "Maximum reach" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setChannel(opt.value as "sms" | "email" | "both");
                setPreviewCount(null);
              }}
              className={`p-3 rounded-lg border-2 text-left transition ${
                channel === opt.value
                  ? "border-[var(--green-500)] bg-[var(--green-100)]/30"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="font-bold text-[var(--navy-900)] text-sm">{opt.label}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{opt.sub}</div>
            </button>
          ))}
        </div>
      </Section>

      {/* Audience */}
      <Section title="3. Who do we target?">
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-semibold text-[var(--navy-900)] mb-1">
              Clients who haven&apos;t filed in at least
            </span>
            <select
              value={lapsedMin}
              onChange={(e) => {
                setLapsedMin(e.target.value);
                setPreviewCount(null);
              }}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-[var(--green-500)] outline-none bg-white text-[var(--navy-900)] text-sm"
            >
              <option value="1">1 year (last season)</option>
              <option value="2">2 years</option>
              <option value="3">3 years</option>
              <option value="4">4+ years (amendment opportunity)</option>
              <option value="5">5+ years</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-[var(--navy-900)]">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => {
                setIncludeArchived(e.target.checked);
                setPreviewCount(null);
              }}
              className="w-4 h-4 rounded border-2 border-slate-300"
            />
            Include archived clients
          </label>
        </div>

        <button
          type="button"
          onClick={previewAudience}
          disabled={previewLoading}
          className="mt-4 text-xs font-bold px-4 py-2 rounded-md border-2 border-[var(--navy-900)] text-[var(--navy-900)] hover:bg-[var(--navy-900)] hover:text-white transition disabled:opacity-50"
        >
          {previewLoading ? "Counting…" : "Preview Audience"}
        </button>

        {previewCount !== null && (
          <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-extrabold text-[var(--navy-900)]">{previewCount}</span>
              <span className="text-sm text-[var(--text-muted)]">recipients will be messaged</span>
            </div>
            {sampleRecipients.length > 0 && (
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] mb-2">
                  Sample (first 10)
                </div>
                <div className="space-y-1 text-sm">
                  {sampleRecipients.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--navy-900)]">{r.full_name}</span>
                      <span className="text-[var(--text-muted)]">
                        {r.years_lapsed != null ? `${r.years_lapsed}y lapsed` : "no filing history"}
                        {r.last_year && ` · last filed ${r.last_year}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {previewCount === 0 && (
              <div className="text-xs text-amber-700 mt-2">
                No clients match. Try a smaller lapsed-years number, add clients first, or include archived.
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Launch */}
      <Section title="4. Launch">
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Click Create & Launch — AI will write a personalized message for every recipient (in batches of 5).
          You can review each one on the campaign page before SMS messages send via the next cron run.
        </p>

        {error && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={createAndLaunch}
          disabled={pending || !name || previewCount === 0}
          className="w-full bg-[var(--navy-900)] text-white font-bold py-3 rounded-lg hover:bg-[var(--green-600)] transition disabled:opacity-50"
        >
          {pending ? "Creating campaign…" : `Create Campaign (${previewCount ?? "?"} recipients) →`}
        </button>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="font-bold text-[var(--navy-900)] mb-3">{title}</h3>
      {children}
    </div>
  );
}
