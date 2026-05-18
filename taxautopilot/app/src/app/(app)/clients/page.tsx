import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, email, phone, status, last_filed_year, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight">Clients</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {clients?.length ?? 0} {clients?.length === 1 ? "client" : "clients"} in your office.
          </p>
        </div>
        <Link
          href="/clients/new"
          className="bg-[var(--navy-900)] text-white font-bold px-4 py-2.5 rounded-lg hover:bg-[var(--green-600)] transition text-sm"
        >
          + Add Client
        </Link>
      </div>

      {clients && clients.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-[var(--text-muted)] text-xs uppercase tracking-wider font-bold">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3 hidden sm:table-cell">Email</th>
                <th className="px-5 py-3 hidden md:table-cell">Phone</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-[var(--navy-900)]">
                    <Link href={`/clients/${c.id}`} className="hover:text-[var(--green-600)]">
                      {c.full_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-muted)] hidden sm:table-cell">
                    {c.email || "—"}
                  </td>
                  <td className="px-5 py-3 text-[var(--text-muted)] hidden md:table-cell">
                    {c.phone || "—"}
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
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-3 opacity-40">👥</div>
          <h3 className="font-bold text-[var(--navy-900)] mb-1">No clients yet</h3>
          <p className="text-sm text-[var(--text-muted)] mb-5">
            Add your first client to start tracking documents and returns.
          </p>
          <Link
            href="/clients/new"
            className="inline-block bg-[var(--navy-900)] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[var(--green-600)] transition text-sm"
          >
            + Add your first client
          </Link>
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
