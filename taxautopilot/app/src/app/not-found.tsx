import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-4">🗺️</div>
        <div className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] mb-2">
          404 — Not Found
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--navy-900)] mb-3">
          That page didn&apos;t make it to TaxAutopilot
        </h1>
        <p className="text-[var(--text-muted)] mb-6">
          The link you followed may be broken, or the page may have moved.
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          <Link
            href="/dashboard"
            className="bg-[var(--navy-900)] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[var(--green-600)] transition text-sm"
          >
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="bg-white border-2 border-slate-200 text-[var(--navy-900)] font-bold px-5 py-2.5 rounded-lg hover:border-slate-300 transition text-sm"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
