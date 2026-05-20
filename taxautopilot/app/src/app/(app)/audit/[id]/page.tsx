import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ReportFindings, Finding } from "@/lib/money-report";
import { PrintReportButton } from "./PrintReportButton";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: report } = await supabase
    .from("money_reports")
    .select("*, organizations(name, subscription_status)")
    .eq("id", id)
    .single();

  if (!report) notFound();

  const orgRaw = report.organizations as unknown;
  const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as
    | { name: string; subscription_status: string }
    | null;

  const isSubscribed = ["active", "trialing"].includes(org?.subscription_status || "");
  const findings = report.findings as ReportFindings;
  const total = Math.round(Number(report.total_opportunity));

  if (report.status === "generating") {
    return (
      <div className="p-10 text-center">
        <div className="text-4xl mb-3">⏳</div>
        <div className="font-bold text-[var(--navy-900)]">Analyzing your data…</div>
        <div className="text-sm text-[var(--text-muted)] mt-2">Refresh in a few seconds.</div>
      </div>
    );
  }

  if (report.status === "failed") {
    return (
      <div className="p-10 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <div className="font-bold text-[var(--navy-900)]">Report generation failed</div>
        <Link href="/audit" className="text-[var(--green-600)] font-semibold mt-3 inline-block">
          ← Back to Audit
        </Link>
      </div>
    );
  }

  const orderedFindings: Finding[] = [
    findings.lapsed_clients,
    findings.amendable_returns,
    findings.quarterly_opportunities,
    findings.irs_notices,
    findings.offseason_silence,
    findings.email_backlog,
  ].sort((a, b) => b.estimated_value - a.estimated_value);

  return (
    <div className="bg-slate-50 print:bg-white min-h-screen">
      <header className="bg-white border-b border-slate-200 print:hidden">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/audit" className="text-sm text-[var(--text-muted)] hover:text-[var(--navy-900)]">
            ← Back to Audit
          </Link>
          <PrintReportButton />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 print:py-4">
        {/* Print-only header */}
        <div className="hidden print:block mb-6 pb-4 border-b border-slate-300">
          <div className="font-bold text-xl text-[var(--navy-900)]">TaxAutopilot</div>
          <div className="text-xs text-[var(--text-muted)]">Money Report · Generated {new Date(report.created_at).toLocaleDateString()}</div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-br from-[var(--navy-900)] to-[var(--navy-700)] text-white rounded-2xl p-8 mb-6 print:bg-slate-100 print:text-[var(--navy-900)] print:border print:border-slate-300">
          <div className="text-xs uppercase font-bold tracking-wider text-[var(--gold)] mb-2 print:text-amber-700">
            Money Report · {org?.name}
          </div>
          <div className="text-sm text-white/70 mb-4 print:text-[var(--text-muted)]">
            Generated {new Date(report.created_at).toLocaleDateString()} ·{" "}
            {report.client_count} clients analyzed
          </div>
          <div className="text-xs uppercase font-bold tracking-wider text-white/60 mb-1 print:text-[var(--text-muted)]">
            Total opportunity missed
          </div>
          <div className="text-5xl font-extrabold mb-4">
            ${total.toLocaleString()}
          </div>
          {report.ai_summary && (
            <p className="text-white/90 leading-relaxed text-base print:text-[var(--text)]">
              {report.ai_summary}
            </p>
          )}
        </div>

        {/* Findings */}
        <div className="space-y-4 mb-6">
          {orderedFindings.map((f) => (
            <FindingCard key={f.category} finding={f} locked={!isSubscribed} />
          ))}
        </div>

        {/* Unlock CTA */}
        {!isSubscribed && (
          <div className="bg-gradient-to-br from-[var(--green-500)] to-[var(--green-600)] text-white rounded-2xl p-8 text-center print:hidden">
            <div className="text-3xl mb-2">🔓</div>
            <h2 className="text-2xl font-extrabold mb-2">
              Unlock ${total.toLocaleString()} in opportunities
            </h2>
            <p className="text-white/90 mb-5 max-w-md mx-auto">
              The action items above are locked. Subscribe to TaxAutopilot and
              instantly get every client name, AI-drafted message, and the workflow
              to recover this revenue.
            </p>
            <Link
              href="/settings/billing"
              className="inline-block bg-[var(--navy-900)] text-white font-extrabold px-6 py-3 rounded-lg hover:bg-black transition"
            >
              See Plans & Pricing →
            </Link>
            <div className="text-xs text-white/80 mt-3">
              Solo plan: $2,497/yr. Locked for life. 60-day money-back guarantee.
            </div>
            <div className="text-[10px] text-white/60 mt-1">
              {total >= 5000 && `That's ${Math.round(total / 2497)}x return on subscription cost.`}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-xs text-[var(--text-muted)] mt-8 text-center">
          Dollar estimates are based on industry-average fees and your office&apos;s data.
          Actual recovery depends on client engagement and your office&apos;s workflow.
        </div>
      </div>
    </div>
  );
}

function FindingCard({ finding, locked }: { finding: Finding; locked: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 print:border-slate-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] mb-1">
            {labelFor(finding.category)}
          </div>
          <div className="text-2xl font-extrabold text-[var(--navy-900)]">
            ${finding.estimated_value.toLocaleString()}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            {finding.count} {finding.count === 1 ? "item" : "items"} · {finding.unit_label}: ${finding.unit_value}
          </div>
        </div>
        {finding.estimated_value > 0 && (
          <div className={`text-3xl ${finding.estimated_value > 5000 ? "" : "opacity-50"}`}>
            {finding.estimated_value > 5000 ? "🔥" : "💵"}
          </div>
        )}
      </div>
      <p className="text-sm text-[var(--text)] leading-relaxed mb-3">{finding.summary}</p>
      <div
        className={`rounded-lg p-3 text-xs flex items-start gap-2 ${
          locked
            ? "bg-slate-50 border border-slate-200 print:bg-slate-100"
            : "bg-[var(--green-100)] border border-[var(--green-500)]/30 print:bg-slate-100"
        }`}
      >
        <span className="shrink-0">{locked ? "🔒" : "✓"}</span>
        <div>
          <strong className="text-[var(--navy-900)]">
            {locked ? "Locked: " : "Unlocked: "}
          </strong>
          <span className={locked ? "text-[var(--text-muted)]" : "text-[var(--text)]"}>
            {finding.detail_blurb}
          </span>
        </div>
      </div>
    </div>
  );
}

function labelFor(c: string): string {
  return (
    {
      lapsed_clients: "🕰 Lapsed Clients",
      amendable_returns: "📑 Amendable Returns",
      quarterly_opportunities: "📅 Quarterly Tax Fees",
      irs_notices: "⚠️ IRS Notice Opportunities",
      offseason_silence: "😶 Off-Season Silence",
      email_backlog: "📧 Email Backlog",
    }[c] || c
  );
}
