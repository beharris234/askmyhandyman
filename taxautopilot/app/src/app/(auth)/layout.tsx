import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-slate-50">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-lg bg-[var(--navy-900)] flex items-center justify-center shadow-md">
              <div className="absolute inset-1.5 rounded-md bg-gradient-to-br from-[var(--green-500)] to-[var(--gold)]" />
              <span className="relative text-white font-extrabold text-sm">T</span>
            </div>
            <span className="font-bold text-[var(--navy-900)] tracking-tight">TaxAutopilot</span>
          </Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
