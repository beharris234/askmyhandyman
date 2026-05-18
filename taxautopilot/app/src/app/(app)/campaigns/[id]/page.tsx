import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LaunchButton } from "./LaunchButton";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (!campaign) notFound();

  const { data: recipients } = await supabase
    .from("campaign_recipients")
    .select("*, clients(id, full_name, email, phone)")
    .eq("campaign_id", id)
    .order("created_at", { ascending: true });

  const counts = {
    pending: recipients?.filter((r) => r.status === "pending").length ?? 0,
    queued: recipients?.filter((r) => r.status === "queued").length ?? 0,
    sent: recipients?.filter((r) => r.status === "sent").length ?? 0,
    skipped: recipients?.filter((r) => r.status === "skipped").length ?? 0,
    failed: recipients?.filter((r) => r.status === "failed").length ?? 0,
    replied: recipients?.filter((r) => r.status === "replied").length ?? 0,
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <Link
        href="/campaigns"
        className="text-sm text-[var(--text-muted)] hover:text-[var(--navy-900)] mb-4 inline-block"
      >
        ← All campaigns
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--navy-900)] tracking-tight">
              {campaign.name}
            </h1>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              {campaign.type.toUpperCase()} · {campaign.channel.toUpperCase()} ·{" "}
              {campaign.audience_count} recipients · Created{" "}
              {new Date(campaign.created_at).toLocaleString()}
            </div>
          </div>
          <StatusPill status={campaign.status} />
        </div>

        {campaign.status === "draft" && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm text-[var(--text-muted)]">
              Click Launch — AI generates a personalized message for every recipient,
              then SMS messages queue for the next cron run.
            </div>
            <LaunchButton id={campaign.id} />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <MiniStat label="Pending" value={counts.pending} />
        <MiniStat label="Queued" value={counts.queued} tone="amber" />
        <MiniStat label="Sent" value={counts.sent} tone="green" />
        <MiniStat label="Replied" value={counts.replied} tone="green" />
        <MiniStat label="Skipped" value={counts.skipped} tone="slate" />
        <MiniStat label="Failed" value={counts.failed} tone="red" />
      </div>

      {/* Recipients */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-[var(--navy-900)]">Recipients</h2>
        </div>
        {recipients && recipients.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recipients.map((r) => {
              const clientRaw = r.clients as unknown;
              const client = (Array.isArray(clientRaw) ? clientRaw[0] : clientRaw) as
                | { id: string; full_name: string }
                | null;
              return (
                <div key={r.id} className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--navy-900)]">
                        {client?.full_name || "Unknown client"}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--navy-100)] text-[var(--navy-700)]">
                        {r.channel}
                      </span>
                    </div>
                    <RecipStatusPill status={r.status} reason={r.skip_reason} />
                  </div>
                  {r.rendered_subject && (
                    <div className="text-xs text-[var(--text-muted)] mb-1">
                      <strong>Subject:</strong> {r.rendered_subject}
                    </div>
                  )}
                  {r.rendered_body ? (
                    <div className="text-sm text-[var(--text)] bg-slate-50 rounded-lg p-3 border border-slate-100 whitespace-pre-wrap leading-relaxed">
                      {r.rendered_body}
                    </div>
                  ) : (
                    <div className="text-xs text-[var(--text-light)] italic">
                      Message will be generated at launch.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">
            No recipients in this campaign.
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "navy",
}: {
  label: string;
  value: number;
  tone?: "navy" | "green" | "amber" | "red" | "slate";
}) {
  const cls = {
    navy: "border-slate-200",
    green: "border-[var(--green-500)]/40 bg-[var(--green-100)]/20",
    amber: "border-amber-300/40 bg-amber-50",
    red: "border-red-200 bg-red-50",
    slate: "border-slate-200 bg-slate-50",
  }[tone];
  return (
    <div className={`rounded-xl border p-3 text-center ${cls}`}>
      <div className="text-2xl font-extrabold text-[var(--navy-900)]">{value}</div>
      <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
        {label}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "bg-slate-100 text-slate-700" },
    sending: { label: "Sending", cls: "bg-amber-100 text-amber-700" },
    complete: { label: "Complete", cls: "bg-[var(--green-100)] text-[var(--green-600)]" },
    paused: { label: "Paused", cls: "bg-slate-100 text-slate-600" },
    failed: { label: "Failed", cls: "bg-red-100 text-red-700" },
  };
  const meta = map[status] || map.draft;
  return (
    <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function RecipStatusPill({ status, reason }: { status: string; reason: string | null }) {
  const map: Record<string, string> = {
    pending: "bg-slate-100 text-slate-600",
    queued: "bg-amber-100 text-amber-700",
    sent: "bg-[var(--green-100)] text-[var(--green-600)]",
    replied: "bg-[var(--green-100)] text-[var(--green-600)]",
    skipped: "bg-slate-100 text-slate-600",
    failed: "bg-red-100 text-red-700",
    converted: "bg-[var(--gold-light)] text-amber-900",
  };
  const cls = map[status] || map.pending;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>
        {status}
      </span>
      {reason && (
        <span className="text-[10px] text-[var(--text-muted)] italic">({reason})</span>
      )}
    </div>
  );
}
