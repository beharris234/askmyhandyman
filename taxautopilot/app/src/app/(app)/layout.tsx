import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "../(auth)/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, organization_id, organizations(name)")
    .eq("id", user.id)
    .single();

  const orgName =
    (profile?.organizations as { name?: string } | null)?.name ?? "Your Office";

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-[var(--navy-900)] text-white">
        <div className="p-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <div className="absolute inset-1.5 rounded-md bg-gradient-to-br from-[var(--green-500)] to-[var(--gold)]" />
              <span className="relative text-white font-extrabold text-sm">T</span>
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight">TaxAutopilot</div>
              <div className="text-xs text-white/50">{orgName}</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavLink href="/dashboard" label="Dashboard" icon="📊" />
          <NavLink href="/clients" label="Clients" icon="👥" />
          <NavLink href="/demo" label="Doc Extractor" icon="📄" external />
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="text-sm font-medium text-white/90 truncate">
            {profile?.full_name || user.email}
          </div>
          <div className="text-xs text-white/50 truncate">{user.email}</div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="mt-3 w-full text-xs text-white/70 hover:text-white border border-white/10 rounded-md py-1.5 hover:bg-white/5 transition"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top nav */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-[var(--navy-900)] text-white z-10 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold tracking-tight">TaxAutopilot</Link>
        <form action={logoutAction}>
          <button type="submit" className="text-xs text-white/70">Sign out</button>
        </form>
      </header>

      <main className="flex-1 md:ml-0 mt-14 md:mt-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon,
  external,
}: {
  href: string;
  label: string;
  icon: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/5 transition"
    >
      <span className="text-base">{icon}</span>
      <span className="font-medium">{label}</span>
      {external && <span className="ml-auto text-xs text-white/40">↗</span>}
    </Link>
  );
}
