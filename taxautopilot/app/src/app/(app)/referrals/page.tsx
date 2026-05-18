import { createClient } from "@/lib/supabase/server";
import {
  REFERRAL_CONFIG,
  buildReferralUrl,
  formatCurrency,
  summarize,
} from "@/lib/referrals";
import { CopyLinkButtons } from "./CopyLinkButtons";

export default async function ReferralsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, organizations(name, referral_code, referral_credit_balance, referral_credit_lifetime)")
    .eq("id", user!.id)
    .single();

  const orgRaw = profile?.organizations as unknown;
  const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as
    | { name: string; referral_code: string; referral_credit_balance: number; referral_credit_lifetime: number }
    | null;

  if (!org) {
    return <div className="p-10">No organization linked.</div>;
  }

  const { data: referralsRaw } = await supabase
    .from("referrals")
    .select("id, status, created_at, qualified_at, referee_org_id, organizations!referrals_referee_org_id_fkey(name)")
    .eq("referrer_org_id", profile!.organization_id)
    .order("created_at", { ascending: false });

  type ReferralRow = {
    id: string;
    status: string;
    created_at: string;
    qualified_at: string | null;
    referee_org_id: string;
    organizations: { name: string } | { name: string }[] | null;
  };
  const referrals = (referralsRaw || []) as ReferralRow[];

  const rollup = summarize(
    Number(org.referral_credit_balance) || 0,
    Number(org.referral_credit_lifetime) || 0,
    referrals
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const referralUrl = buildReferralUrl(org.referral_code, appUrl);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight mb-1">
        Refer & Earn
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-8">
        Refer other tax offices to TaxAutopilot. Earn $250 credit toward your next renewal for every signup. <strong>{REFERRAL_CONFIG.freeYearReferralThreshold} qualified referrals = your renewal is free.</strong>
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Referrals"
          value={String(rollup.totalReferrals)}
          hint={`${rollup.qualifiedReferrals} qualified`}
        />
        <StatCard
          label="Credit Balance"
          value={formatCurrency(rollup.creditBalance)}
          hint="Toward your next renewal"
          accent
        />
        <StatCard
          label="Next Renewal Cost"
          value={formatCurrency(rollup.appliedNextRenewalPrice)}
          hint={`After ${formatCurrency(rollup.creditBalance)} credit`}
        />
        <StatCard
          label="Lifetime Earned"
          value={formatCurrency(rollup.lifetimeCredits)}
          hint="All time"
        />
      </div>

      {/* Progress to free year */}
      <div className="bg-gradient-to-r from-[var(--navy-900)] to-[var(--navy-700)] text-white rounded-2xl p-6 mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-xs uppercase font-bold tracking-wider text-[var(--gold)] mb-2">
            Free Year Progress
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-4xl font-extrabold">{rollup.qualifiedReferrals}</span>
            <span className="text-lg text-white/60">/ {REFERRAL_CONFIG.freeYearReferralThreshold}</span>
            <span className="text-sm text-white/70 ml-2">qualified referrals</span>
          </div>
          <div className="bg-white/10 rounded-full h-3 overflow-hidden mb-3">
            <div
              className="bg-gradient-to-r from-[var(--green-500)] to-[var(--gold)] h-full transition-all"
              style={{ width: `${Math.max(rollup.progressToFreeYear * 100, 2)}%` }}
            />
          </div>
          <div className="text-sm text-white/80">
            {rollup.referralsToNextFreeYear === 0
              ? "🎉 You've earned a free renewal year!"
              : `${rollup.referralsToNextFreeYear} more qualified referral${rollup.referralsToNextFreeYear === 1 ? "" : "s"} = full free year.`}
          </div>
        </div>
      </div>

      {/* Share */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
        <h2 className="font-bold text-[var(--navy-900)] mb-1">Your referral link</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Share this link with other tax pros. They get $250 off their first year. You get $250 toward your renewal.
        </p>
        <CopyLinkButtons referralUrl={referralUrl} referralCode={org.referral_code} officeName={org.name} />
      </div>

      {/* Referrals list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-[var(--navy-900)]">Your referrals</h2>
        </div>
        {referrals.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold">
              <tr>
                <th className="text-left px-5 py-3">Office</th>
                <th className="text-left px-5 py-3">Signed up</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {referrals.map((r) => {
                const name = (Array.isArray(r.organizations) ? r.organizations[0]?.name : r.organizations?.name) || "Unknown";
                return (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-semibold text-[var(--navy-900)]">{name}</td>
                    <td className="px-5 py-3 text-[var(--text-muted)]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-[var(--green-600)]">
                      {r.status === "signed_up" ? "Pending" : "+$250"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-10 text-center">
            <div className="text-4xl mb-3 opacity-40">🤝</div>
            <p className="text-sm text-[var(--text-muted)]">
              No referrals yet. Share your link above to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent
          ? "border-[var(--green-500)] bg-[var(--green-100)]/40"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] mb-1">
        {label}
      </div>
      <div className={`text-2xl font-extrabold ${accent ? "text-[var(--green-600)]" : "text-[var(--navy-900)]"}`}>
        {value}
      </div>
      <div className="text-xs text-[var(--text-muted)] mt-1">{hint}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    signed_up: { label: "Signed Up", cls: "bg-amber-100 text-amber-700" },
    qualified: { label: "Qualified", cls: "bg-[var(--green-100)] text-[var(--green-600)]" },
    applied: { label: "Credit Applied", cls: "bg-[var(--navy-100)] text-[var(--navy-700)]" },
    reversed: { label: "Reversed", cls: "bg-red-100 text-red-700" },
  };
  const meta = map[status] || map.signed_up;
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${meta.cls}`}>
      {meta.label}
    </span>
  );
}
