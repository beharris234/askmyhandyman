import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./InviteForm";
import { RevokeInviteButton } from "./RevokeInviteButton";

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) redirect("/dashboard");

  const canInvite = profile.role === "owner" || profile.role === "admin";

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: true });

  const { data: invitesRaw } = await supabase
    .from("invitations")
    .select("id, email, role, status, created_at, expires_at, token")
    .eq("organization_id", profile.organization_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const invites = invitesRaw || [];
  const memberCount = members?.length ?? 0;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight mb-1">
        Team
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-8">
        {memberCount} member{memberCount === 1 ? "" : "s"}{" "}
        {invites.length > 0 && `· ${invites.length} pending invite${invites.length === 1 ? "" : "s"}`}
      </p>

      {/* Invite form (owners/admins only) */}
      {canInvite && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="font-bold text-[var(--navy-900)] mb-4">Invite a teammate</h2>
          <InviteForm />
        </div>
      )}

      {/* Members */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-[var(--navy-900)]">Members</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {members?.map((m) => (
            <div key={m.id} className="p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--navy-100)] flex items-center justify-center font-bold text-[var(--navy-900)]">
                  {(m.full_name || m.email || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-[var(--navy-900)]">
                    {m.full_name || m.email}
                    {m.id === user.id && (
                      <span className="ml-2 text-[10px] font-bold text-[var(--text-muted)]">YOU</span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">{m.email}</div>
                </div>
              </div>
              <RolePill role={m.role} />
            </div>
          ))}
        </div>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-bold text-[var(--navy-900)]">Pending invites</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {invites.map((inv) => {
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
              const inviteUrl = `${appUrl}/accept-invite?token=${inv.token}`;
              return (
                <div key={inv.id} className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-semibold text-[var(--navy-900)]">{inv.email}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        Invited {new Date(inv.created_at).toLocaleDateString()} ·{" "}
                        expires {new Date(inv.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RolePill role={inv.role} />
                      {canInvite && <RevokeInviteButton id={inv.id} />}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-xs font-mono text-[var(--navy-900)] break-all border border-slate-200">
                    {inviteUrl}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RolePill({ role }: { role: string }) {
  const cls =
    role === "owner"
      ? "bg-[var(--gold-light)] text-amber-900"
      : role === "admin"
      ? "bg-[var(--navy-100)] text-[var(--navy-700)]"
      : "bg-[var(--green-100)] text-[var(--green-600)]";
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>
      {role}
    </span>
  );
}
