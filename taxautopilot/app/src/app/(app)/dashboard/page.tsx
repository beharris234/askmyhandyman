import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { count: clientCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true });

  const { count: docCount } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true });

  const { data: recentExtractions } = await supabase
    .from("extractions")
    .select("id, document_id, confidence, created_at, result")
    .order("created_at", { ascending: false })
    .limit(5);

  const firstName = (profile?.full_name || "there").split(" ")[0];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight">
          Good {timeOfDay()}, {firstName} 👋
        </h1>
        <p className="text-[var(--text-muted)] mt-1">Here&apos;s what&apos;s happening in your office.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Stat label="Clients" value={clientCount ?? 0} hint="Total in your database" />
        <Stat label="Documents Processed" value={docCount ?? 0} hint="All-time" />
        <Stat label="Active This Week" value={0} hint="Returns in progress" />
      </div>

      {/* Quick actions */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
        <h2 className="font-bold text-[var(--navy-900)] mb-4">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ActionCard
            href="/clients/new"
            icon="➕"
            title="Add a client"
            sub="Manually create a new client record"
          />
          <ActionCard
            href="/clients"
            icon="👥"
            title="View clients"
            sub="See your full client list"
          />
          <ActionCard
            href="/demo"
            icon="⚡"
            title="Extract a doc"
            sub="Run the AI engine on a W-2, 1099, etc."
            external
          />
        </div>
      </section>

      {/* Recent extractions */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-[var(--navy-900)] mb-4">Recent extractions</h2>
        {recentExtractions && recentExtractions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentExtractions.map((ex) => {
              const r = ex.result as { document_type?: string; tax_year?: string };
              return (
                <div key={ex.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-semibold text-[var(--navy-900)]">
                      {r?.document_type || "Unknown"}
                      {r?.tax_year && (
                        <span className="ml-2 text-[var(--text-muted)] font-normal">
                          · {r.tax_year}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {new Date(ex.created_at).toLocaleString()}
                    </div>
                  </div>
                  <ConfidencePill confidence={ex.confidence} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-4xl mb-2 opacity-40">📄</div>
            <div className="text-sm text-[var(--text-muted)] mb-3">No extractions yet.</div>
            <Link
              href="/demo"
              className="inline-block bg-[var(--navy-900)] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[var(--green-600)] transition"
            >
              Try the extractor →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)]">
        {label}
      </div>
      <div className="text-3xl font-extrabold text-[var(--navy-900)] mt-1">{value}</div>
      <div className="text-xs text-[var(--text-muted)] mt-1">{hint}</div>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  sub,
  external,
}: {
  href: string;
  icon: string;
  title: string;
  sub: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="block rounded-xl border border-slate-200 p-4 hover:border-[var(--green-500)] hover:shadow-sm transition group"
    >
      <div className="text-2xl mb-1.5">{icon}</div>
      <div className="font-bold text-[var(--navy-900)] group-hover:text-[var(--green-600)]">{title}</div>
      <div className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</div>
    </Link>
  );
}

function ConfidencePill({ confidence }: { confidence: string | null }) {
  const cls =
    confidence === "high"
      ? "bg-[var(--green-100)] text-[var(--green-600)]"
      : confidence === "medium"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-600";
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${cls}`}>
      {confidence || "—"}
    </span>
  );
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
