import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, file_name, document_type, tax_year, created_at, extraction_status")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <Link
        href="/clients"
        className="text-sm text-[var(--text-muted)] hover:text-[var(--navy-900)] mb-4 inline-block"
      >
        ← All clients
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--navy-900)] tracking-tight">
              {client.full_name}
            </h1>
            <div className="mt-2 space-y-0.5 text-sm text-[var(--text-muted)]">
              {client.email && <div>📧 {client.email}</div>}
              {client.phone && <div>📞 {client.phone}</div>}
              {client.ssn_last4 && <div>SSN: •••-••-{client.ssn_last4}</div>}
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
              client.status === "active"
                ? "bg-[var(--green-100)] text-[var(--green-600)]"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {client.status}
          </span>
        </div>

        {client.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-[var(--text-muted)]">
            <div className="font-semibold text-[var(--navy-900)] text-xs uppercase tracking-wider mb-1">
              Notes
            </div>
            {client.notes}
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[var(--navy-900)]">Documents</h2>
          <Link
            href="/demo"
            target="_blank"
            className="text-xs font-semibold text-[var(--green-600)] hover:underline"
          >
            Try the extractor →
          </Link>
        </div>

        {documents && documents.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div key={doc.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold text-[var(--navy-900)]">
                    {doc.document_type || doc.file_name || "Untitled document"}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {doc.tax_year && <>Tax year {doc.tax_year} · </>}
                    {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span className="text-xs font-bold uppercase text-[var(--text-muted)]">
                  {doc.extraction_status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-3xl mb-2 opacity-40">📄</div>
            <div className="text-sm text-[var(--text-muted)]">
              No documents yet. Upload via the extractor — full per-client upload coming in Phase 3.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
