import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RunAuditButton } from "./RunAuditButton";

export default async function AuditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, organizations(name, subscription_status)")
    .eq("id", user!.id)
    .single();

  const orgRaw = profile?.organizations as unknown;
  const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as
    | { name: string; subscription_status: string }
    | null;

  const { data: reports } = await supabase
    .from("money_reports")
    .select("id, status, total_opportunity, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const { count: clientCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true });

  const ready = (clientCount ?? 0) > 0;
  const isSubscribed = ["active", "trialing"].includes(org?.subscription_status || "");

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight mb-1">
        💸 Money Report
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-8">
        We scan your office data and tell you what revenue you may be leaving on the table.
        {!isSubscribed && " Free to run — subscribe to unlock the action items."}
      </p>

      {!ready && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <div className="font-bold text-amber-900 mb-2">⚠️ Import clients first</div>
          <p className="text-sm text-amber-800 mb-3">
            The Money Report needs your client list to find missed opportunities. Either add
            clients one at a time or bulk import from your tax software (~5 min).
          </p>
          <Link
            href="/clients/import"
            className="inline-block bg-amber-900 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-amber-800 transition"
          >
            Import Clients →
          </Link>
        </div>
      )}

      {ready && (
        <div className="bg-gradient-to-br from-[var(--navy-900)] to-[var(--navy-700)] text-white rounded-2xl p-6 mb-6">
          <div className="text-xs uppercase font-bold tracking-wider text-[var(--gold)] mb-2">
            Ready to scan
          </div>
          <div className="font-bold text-xl mb-2">
            {clientCount} clients in your database
          </div>
          <p className="text-sm text-white/80 mb-4">
            Click below — we&apos;ll analyze every record across 6 categories of missed revenue
            (lapsed clients, amendable returns, quarterly fees, IRS notices, off-season silence,
            email backlog). Takes 5-10 seconds.
          </p>
          <RunAuditButton />
        </div>
      )}

      {reports && reports.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-bold text-[var(--navy-900)]">Past reports</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {reports.map((r) => (
              <Link
                key={r.id}
                href={`/audit/${r.id}`}
                className="block p-4 hover:bg-slate-50 transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-[var(--navy-900)]">
                      {r.status === "complete" ? (
                        <>
                          💰 <span className="text-[var(--green-600)]">${Math.round(Number(r.total_opportunity)).toLocaleString()}</span> opportunity found
                        </>
                      ) : r.status === "generating" ? (
                        <>⏳ Generating…</>
                      ) : (
                        <>⚠️ Failed</>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[var(--green-600)] font-bold text-sm">View →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
