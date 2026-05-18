import Link from "next/link";
import { ImportForm } from "./ImportForm";

export default function ImportClientsPage() {
  const sampleCsv = `full_name,email,phone,ssn_last4,last_filed_year,notes
Jane Doe,jane@example.com,(555) 123-4567,6789,2024,VIP client - direct deposit only
John Smith,john@example.com,(555) 987-6543,1234,2023,Has rental property
Marcus Johnson,marcus@example.com,5551112222,5678,2022,Self-employed - schedule C
`;

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <Link
        href="/clients"
        className="text-sm text-[var(--text-muted)] hover:text-[var(--navy-900)] mb-4 inline-block"
      >
        ← Back to clients
      </Link>

      <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight mb-1">
        Import Clients from CSV
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Export your client list from Drake, CrossLink, Lacerte, ProSeries, UltraTax, TaxWise, or TaxSlayer Pro as a CSV.
        Drop it here and we&apos;ll bulk import. Up to 10MB / a few thousand rows.
      </p>

      {/* Format guide */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="font-bold text-[var(--navy-900)] mb-3">CSV format</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">
          Your CSV must have a column header row. The only <strong>required</strong> column is{" "}
          <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">full_name</code> (or{" "}
          <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">name</code>).
        </p>
        <div className="text-xs text-[var(--text-muted)] mb-3">
          <strong className="text-[var(--navy-900)]">Recognized columns</strong> (any combination):
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {[
            ["full_name", "Required"],
            ["email", "Email address"],
            ["phone", "Any format"],
            ["ssn_last4", "Last 4 digits"],
            ["last_filed_year", "e.g. 2024"],
            ["notes", "Free text"],
          ].map(([col, desc]) => (
            <div key={col} className="rounded-md bg-slate-50 p-2 border border-slate-200">
              <div className="font-mono font-bold text-[var(--navy-900)]">{col}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{desc}</div>
            </div>
          ))}
        </div>

        <details className="mt-4">
          <summary className="text-sm font-semibold text-[var(--green-600)] cursor-pointer">
            See example CSV
          </summary>
          <pre className="mt-2 bg-slate-900 text-green-400 p-3 rounded-lg text-[10px] overflow-x-auto">
            {sampleCsv}
          </pre>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(sampleCsv)}`}
            download="taxautopilot-sample-clients.csv"
            className="inline-block mt-2 text-xs font-bold text-[var(--green-600)] hover:underline"
          >
            ↓ Download sample CSV
          </a>
        </details>
      </div>

      {/* Upload form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-[var(--navy-900)] mb-3">Upload your file</h2>
        <ImportForm />
      </div>

      <div className="mt-4 text-xs text-[var(--text-muted)]">
        💡 If you&apos;re a preparer, imported clients will be auto-assigned to you.
        If you&apos;re an owner/admin, they&apos;ll go to the office queue (unassigned)
        for the team to claim or for you to assign.
      </div>
    </div>
  );
}
