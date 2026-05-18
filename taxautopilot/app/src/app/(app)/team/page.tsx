import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./InviteForm";
import { RevokeInviteButton } from "./RevokeInviteButton";

type Stats = {
  client_count: number;
  active_refunds: number;
  refunds_completed: number;
  messages_sent: number;
  phone_number: string | null;
};

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

  // === Per-preparer stats ===
  const statsByMember = new Map<string, Stats>();
  for (const m of members || []) {
    statsByMember.set(m.id, {
      client_count: 0,
      active_refunds: 0,
      refunds_completed: 0,
      messages_sent: 0,
      phone_number: null,
    });
  }

  // Clients assigned per preparer
  const { data: clientRows } = await supabase
    .from("clients")
    .select("assigned_preparer_id")
    .eq("organization_id", profile.organization_id)
    .not("assigned_preparer_id", "is", null);
  for (const c of clientRows || []) {
    const s = statsByMember.get(c.assigned_preparer_id);
    if (s) s.client_count++;
  }

  // Refunds per preparer (via the assigned client)
  const { data: refundRows } = await supabase
    .from("refund_tracks")
    .select("current_status, clients!inner(assigned_preparer_id)")
    .eq("organization_id", profile.organization_id);
  for (const r of refundRows || []) {
    const cRaw = r.clients as unknown;
    const c = (Array.isArray(cRaw) ? cRaw[0] : cRaw) as { assigned_preparer_id: string } | null;
    if (!c?.assigned_preparer_id) continue;
    const s = statsByMember.get(c.assigned_preparer_id);
    if (!s) continue;
    if (r.current_status === "received") s.refunds_completed++;
    else s.active_refunds++;
  }

  // Outbound messages sent per preparer (sent_by)
  const { data: msgRows } = await supabase
    .from("messages")
    .select("sent_by")
    .eq("organization_id", profile.organization_id)
    .eq("direction", "outbound")
    .not("sent_by", "is", null);
  for (const m of msgRows || []) {
    const s = statsByMember.get(m.sent_by);
    if (s) s.messages_sent++;
  }

  // Personal Twilio number per preparer
  const { data: twilioRows } = await supabase
    .from("twilio_numbers")
    .select("preparer_id, phone_number")
    .eq("organization_id", profile.organization_id)
    .eq("status", "active")
    .not("preparer_id", "is", null);
  for (const t of twilioRows || []) {
    const s = statsByMember.get(t.preparer_id);
    if (s) s.phone_number = t.phone_number;
  }

  // Sort members by client count desc for leaderboard
  const sortedMembers = (members || []).slice().sort((a, b) => {
    const av = statsByMember.get(a.id)?.client_count ?? 0;
    const bv = statsByMember.get(b.id)?.client_count ?? 0;
    return bv - av;
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight mb-1">
        Team
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-8">
        {memberCount} member{memberCount === 1 ? "" : "s"}{" "}
        {invites.length > 0 && `· ${invites.length} pending invite${invites.length === 1 ? "" : "s"}`}
      </p>

      {/* Invite form */}
      {canInvite && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="font-bold text-[var(--navy-900)] mb-4">Invite a teammate</h2>
          <InviteForm />
        </div>
      )}

      {/* Members + stats */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-[var(--navy-900)]">Team performance</h2>
          <span className="text-xs text-[var(--text-muted)]">Sorted by client count</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold">
              <tr>
                <th className="text-left px-5 py-3">Member</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Role</th>
                <th className="text-right px-5 py-3">Clients</th>
                <th className="text-right px-5 py-3 hidden md:table-cell">Active Refunds</th>
                <th className="text-right px-5 py-3 hidden md:table-cell">Completed</th>
                <th className="text-right px-5 py-3 hidden lg:table-cell">Msgs Sent</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">SMS Line</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedMembers.map((m, idx) => {
                const s = statsByMember.get(m.id);
                const isMe = m.id === user.id;
                return (
                  <tr key={m.id} className={isMe ? "bg-[var(--green-100)]/30" : "hover:bg-slate-50"}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--navy-100)] flex items-center justify-center font-bold text-[var(--navy-900)] text-sm shrink-0">
                          {(m.full_name || m.email || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--navy-900)] flex items-center gap-1.5">
                            {idx === 0 && (s?.client_count ?? 0) > 0 && <span title="Top performer">🥇</span>}
                            {m.full_name || m.email}
                            {isMe && (
                              <span className="text-[10px] font-bold text-[var(--text-muted)]">YOU</span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">
                            {m.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <RolePill role={m.role} />
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-[var(--navy-900)]">
                      {s?.client_count ?? 0}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[var(--text)] hidden md:table-cell">
                      {s?.active_refunds ?? 0}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[var(--green-600)] font-bold hidden md:table-cell">
                      {s?.refunds_completed ?? 0}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[var(--text-muted)] hidden lg:table-cell">
                      {s?.messages_sent ?? 0}
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--text-muted)] hidden lg:table-cell">
                      {s?.phone_number ? (
                        <span className="font-mono text-[var(--navy-900)]">{s.phone_number}</span>
                      ) : (
                        <span className="italic text-[var(--text-light)]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
