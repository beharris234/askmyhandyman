import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { defaultClientFilter, isManager } from "@/lib/permissions";
import { ClientFilterTabs } from "./ClientFilterTabs";

type SearchParams = Promise<{ filter?: "mine" | "all" | "unassigned"; preparer?: string }>;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user!.id)
    .single();

  const role = profile?.role;
  const activeFilter = params.filter ?? defaultClientFilter(role);

  let q = supabase
    .from("clients")
    .select(
      "id, full_name, email, phone, status, last_filed_year, created_at, assigned_preparer_id, profiles!clients_assigned_preparer_id_fkey(id, full_name, email)"
    )
    .order("created_at", { ascending: false });

  if (activeFilter === "mine") {
    q = q.eq("assigned_preparer_id", user!.id);
  } else if (activeFilter === "unassigned") {
    q = q.is("assigned_preparer_id", null);
  }
  if (params.preparer && isManager(role)) {
    q = q.eq("assigned_preparer_id", params.preparer);
  }

  const { data: clients } = await q;

  // Counts for tabs
  const { count: mineCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("assigned_preparer_id", user!.id);
  const { count: allCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true });
  const { count: unassignedCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .is("assigned_preparer_id", null);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight">Clients</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {clients?.length ?? 0} {clients?.length === 1 ? "client" : "clients"} in this view.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/clients/import"
            className="bg-white border-2 border-[var(--navy-900)] text-[var(--navy-900)] font-bold px-3 py-2 rounded-lg hover:bg-[var(--navy-900)] hover:text-white transition text-sm"
          >
            ⬆ Import CSV
          </Link>
          <Link
            href="/clients/new"
            className="bg-[var(--navy-900)] text-white font-bold px-4 py-2.5 rounded-lg hover:bg-[var(--green-600)] transition text-sm"
          >
            + Add Client
          </Link>
        </div>
      </div>

      <ClientFilterTabs
        active={activeFilter}
        mineCount={mineCount ?? 0}
        allCount={allCount ?? 0}
        unassignedCount={unassignedCount ?? 0}
      />

      {clients && clients.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mt-4">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-[var(--text-muted)] text-xs uppercase tracking-wider font-bold">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3 hidden sm:table-cell">Email</th>
                <th className="px-5 py-3 hidden lg:table-cell">Phone</th>
                <th className="px-5 py-3 hidden md:table-cell">Assigned</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => {
                const preparerRaw = c.profiles as unknown;
                const preparer = (Array.isArray(preparerRaw) ? preparerRaw[0] : preparerRaw) as
                  | { id: string; full_name: string }
                  | null;
                const isMe = preparer?.id === user!.id;
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-[var(--navy-900)]">
                      <Link href={`/clients/${c.id}`} className="hover:text-[var(--green-600)]">
                        {c.full_name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)] hidden sm:table-cell truncate max-w-[200px]">
                      {c.email || "—"}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)] hidden lg:table-cell">
                      {c.phone || "—"}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      {preparer ? (
                        <span className={`text-xs font-semibold ${isMe ? "text-[var(--green-600)]" : "text-[var(--text)]"}`}>
                          {isMe ? "You" : preparer.full_name}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-light)] italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/clients/${c.id}`} className="text-xs font-semibold text-[var(--green-600)] hover:underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center mt-4">
          <div className="text-5xl mb-3 opacity-40">👥</div>
          <h3 className="font-bold text-[var(--navy-900)] mb-1">
            {activeFilter === "mine"
              ? "No clients assigned to you yet"
              : activeFilter === "unassigned"
              ? "No unassigned clients"
              : "No clients yet"}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-5">
            {activeFilter === "mine"
              ? "Switch to All Clients to claim some from the office queue."
              : "Add your first client to start tracking documents and returns."}
          </p>
          {activeFilter !== "mine" && (
            <Link
              href="/clients/new"
              className="inline-block bg-[var(--navy-900)] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[var(--green-600)] transition text-sm"
            >
              + Add your first client
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "active"
      ? "bg-[var(--green-100)] text-[var(--green-600)]"
      : status === "lapsed"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-600";
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${cls}`}>
      {status}
    </span>
  );
}
