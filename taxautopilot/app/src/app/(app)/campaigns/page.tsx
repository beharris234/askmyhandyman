import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CampaignsPage() {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, type, channel, audience_count, status, created_at, launched_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight">
            Campaigns
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Win-back lapsed clients, send review requests, or run any one-shot outreach.
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="bg-[var(--navy-900)] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[var(--green-600)] transition text-sm"
        >
          + New Campaign
        </Link>
      </div>

      {campaigns && campaigns.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold">
              <tr>
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Type</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Channel</th>
                <th className="text-left px-5 py-3">Audience</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-[var(--navy-900)]">
                    <Link href={`/campaigns/${c.id}`} className="hover:text-[var(--green-600)]">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-muted)] hidden sm:table-cell capitalize">
                    {c.type}
                  </td>
                  <td className="px-5 py-3 text-[var(--text-muted)] hidden md:table-cell uppercase text-xs font-bold">
                    {c.channel}
                  </td>
                  <td className="px-5 py-3 text-[var(--navy-900)] font-mono font-bold">
                    {c.audience_count}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/campaigns/${c.id}`} className="text-xs font-bold text-[var(--green-600)] hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-3 opacity-40">📣</div>
          <h3 className="font-bold text-[var(--navy-900)] mb-2">No campaigns yet</h3>
          <p className="text-sm text-[var(--text-muted)] mb-5 max-w-md mx-auto">
            Run a win-back to find lapsed clients in your database. AI writes a
            personal message for every single one. Most offices find $5K-$15K
            hiding in their first sweep.
          </p>
          <Link
            href="/campaigns/new"
            className="inline-block bg-[var(--navy-900)] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[var(--green-600)] transition text-sm"
          >
            Run your first win-back →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "bg-slate-100 text-slate-600" },
    sending: { label: "Sending", cls: "bg-amber-100 text-amber-700" },
    launched: { label: "Launched", cls: "bg-[var(--navy-100)] text-[var(--navy-700)]" },
    complete: { label: "Complete", cls: "bg-[var(--green-100)] text-[var(--green-600)]" },
    paused: { label: "Paused", cls: "bg-slate-100 text-slate-600" },
    failed: { label: "Failed", cls: "bg-red-100 text-red-700" },
  };
  const meta = map[status] || map.draft;
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${meta.cls}`}>
      {meta.label}
    </span>
  );
}
