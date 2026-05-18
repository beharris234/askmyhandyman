import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "./AccountForm";
import { DangerZone } from "./DangerZone";

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user!.id)
    .single();

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <Link
        href="/settings"
        className="text-sm text-[var(--text-muted)] hover:text-[var(--navy-900)] mb-4 inline-block"
      >
        ← Back to settings
      </Link>

      <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight mb-1">
        Account
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Update your personal info, email, or password.
      </p>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="font-bold text-[var(--navy-900)] mb-4">Your details</h2>
        <AccountForm
          initialFullName={profile?.full_name || ""}
          initialEmail={profile?.email || user?.email || ""}
        />
      </div>

      <div className="bg-white rounded-2xl border-2 border-red-200 p-6">
        <h2 className="font-bold text-red-700 mb-1">Danger zone</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Export your data or permanently delete your account. Deletion is immediate and irreversible.
        </p>
        <DangerZone />
      </div>
    </div>
  );
}
