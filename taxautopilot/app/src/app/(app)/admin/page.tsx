import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isSuperAdmin, tierMrr, TIER_ANNUAL_CENTS } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Auth gate: only super admins
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isSuperAdmin(user.email)) {
    notFound();
  }

  const admin = createAdminClient();

  // Run all queries in parallel
  const [
    allOrgs,
    allMoneyReports,
    paidOrgs,
    referrals,
    paymentEvents,
    docs,
    campaigns,
    messages,
    refundTracks,
    invitations,
    canceled,
  ] = await Promise.all([
    admin.from("organizations").select("id, name, tier, subscription_status, created_at, referral_credit_lifetime"),
    admin.from("money_reports").select("id, organization_id, total_opportunity, status, created_at"),
    admin.from("organizations").select("id, tier").in("subscription_status", ["active", "trialing"]),
    admin.from("referrals").select("id, referrer_org_id, status, created_at"),
    admin.from("payment_events").select("id, event_type, processed_at").gte("processed_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    admin.from("documents").select("id", { count: "exact", head: true }),
    admin.from("campaigns").select("id, status"),
    admin.from("messages").select("id, direction, ai_generated, created_at"),
    admin.from("refund_tracks").select("id, current_status"),
    admin.from("invitations").select("id, status"),
    admin.from("organizations").select("id, created_at").eq("subscription_status", "canceled"),
  ]);

  const orgs = allOrgs.data || [];
  const moneyReports = allMoneyReports.data || [];
  const paid = paidOrgs.data || [];

  // === MRR / ARR ===
  let mrrDollars = 0;
  const tierCounts: Record<string, number> = { solo: 0, growth: 0, office: 0, enterprise: 0 };
  for (const o of paid) {
    mrrDollars += tierMrr(o.tier);
    tierCounts[o.tier] = (tierCounts[o.tier] || 0) + 1;
  }
  const arrDollars = mrrDollars * 12;

  // === FUNNEL ===
  const totalSignups = orgs.length;
  const orgsWithReports = new Set(moneyReports.map((r) => r.organization_id)).size;
  const paidCount = paid.length;
  const signupToReport = totalSignups > 0 ? Math.round((orgsWithReports / totalSignups) * 100) : 0;
  const reportToPaid = orgsWithReports > 0 ? Math.round((paidCount / orgsWithReports) * 100) : 0;
  const overallConversion = totalSignups > 0 ? Math.round((paidCount / totalSignups) * 100) : 0;

  // === MONEY REPORT ANALYTICS ===
  const completeReports = moneyReports.filter((r) => r.status === "complete");
  const avgFinding =
    completeReports.length > 0
      ? completeReports.reduce((sum, r) => sum + Number(r.total_opportunity || 0), 0) / completeReports.length
      : 0;
  const reportsOver30k = completeReports.filter((r) => Number(r.total_opportunity || 0) >= 30000).length;
  const biggestFind = completeReports.reduce((m, r) => Math.max(m, Number(r.total_opportunity || 0)), 0);

  // === REFERRALS ===
  const refsCount = referrals.data?.length || 0;
  const refsCreditDollars = orgs.reduce((sum, o) => sum + Number(o.referral_credit_lifetime || 0), 0);
  const referrerCount = new Map<string, number>();
  for (const r of referrals.data || []) {
    referrerCount.set(r.referrer_org_id, (referrerCount.get(r.referrer_org_id) || 0) + 1);
  }
  const topReferrers = Array.from(referrerCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const orgNameById = new Map(orgs.map((o) => [o.id, o.name]));

  // === ENGAGEMENT (last 7 / 14 days) ===
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

  const recentMessages = (messages.data || []).filter((m) => new Date(m.created_at).getTime() >= sevenDaysAgo);
  const outboundSentByPreparer = recentMessages.filter((m) => m.direction === "outbound" && !m.ai_generated).length;
  const aiGeneratedThisWeek = recentMessages.filter((m) => m.ai_generated).length;

  const newSignupsThisWeek = orgs.filter((o) => new Date(o.created_at).getTime() >= sevenDaysAgo).length;
  const newReportsThisWeek = moneyReports.filter((r) => new Date(r.created_at).getTime() >= sevenDaysAgo).length;

  // Inactive paid accounts (no messages/reports in 14+ days)
  const paidOrgIds = new Set(paid.map((p) => p.id));
  const recentlyActiveOrgIds = new Set<string>();
  for (const m of messages.data || []) {
    if (new Date(m.created_at).getTime() >= fourteenDaysAgo) recentlyActiveOrgIds.add((m as { client_id?: string }).client_id || "");
  }
  for (const r of moneyReports) {
    if (new Date(r.created_at).getTime() >= fourteenDaysAgo) recentlyActiveOrgIds.add(r.organization_id);
  }
  const inactivePaid = [...paidOrgIds].filter((id) => !recentlyActiveOrgIds.has(id)).length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight">
            🔒 Platform Admin
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Operator view — super-admins only. Cross-org analytics.
          </p>
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          Updated {new Date().toLocaleString()}
        </div>
      </div>

      {/* MRR / ARR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <BigStat label="MRR" value={`$${Math.round(mrrDollars).toLocaleString()}`} hint={`From ${paidCount} active subscriptions`} accent="green" />
        <BigStat label="ARR" value={`$${Math.round(arrDollars).toLocaleString()}`} hint="Annual run rate" />
        <BigStat label="Total Signups" value={String(totalSignups)} hint={`+${newSignupsThisWeek} this week`} accent="gold" />
      </div>

      {/* FUNNEL */}
      <Card title="📊 Conversion Funnel" description="Signup → Audit → Subscribe">
        <FunnelRow
          stage="Total Signups"
          count={totalSignups}
          percentOfPrev={100}
          percentOfTotal={100}
        />
        <FunnelRow
          stage="Ran Money Report"
          count={orgsWithReports}
          percentOfPrev={signupToReport}
          percentOfTotal={signupToReport}
        />
        <FunnelRow
          stage="Subscribed (paid)"
          count={paidCount}
          percentOfPrev={reportToPaid}
          percentOfTotal={overallConversion}
          highlight
        />
      </Card>

      {/* Money Report analytics */}
      <Card title="💸 Money Report Analytics" description="Average findings + how the audit drives subscriptions">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat label="Reports run" value={moneyReports.length} />
          <MiniStat label="Avg finding" value={`$${Math.round(avgFinding).toLocaleString()}`} accent="green" />
          <MiniStat label="Reports >$30K" value={reportsOver30k} />
          <MiniStat label="Biggest find" value={`$${Math.round(biggestFind).toLocaleString()}`} accent="gold" />
        </div>
      </Card>

      {/* Tier mix */}
      <Card title="🏢 Tier Mix" description="Distribution of paying customers">
        <div className="grid grid-cols-3 gap-4">
          {(["solo", "growth", "office"] as const).map((tier) => (
            <TierRow
              key={tier}
              tier={tier}
              count={tierCounts[tier] || 0}
              totalPaid={paidCount}
              annualRevenue={(tierCounts[tier] || 0) * (TIER_ANNUAL_CENTS[tier] / 100)}
            />
          ))}
        </div>
      </Card>

      {/* Referrals */}
      <Card title="🎁 Referral Program" description="Viral coefficient and top advocates">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <MiniStat label="Total referrals" value={refsCount} />
          <MiniStat label="Credits awarded" value={`$${Math.round(refsCreditDollars).toLocaleString()}`} />
          <MiniStat label="Free-year hits" value={topReferrers.filter(([, c]) => c >= 10).length} accent="gold" />
        </div>
        {topReferrers.length > 0 && (
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] mb-2">Top 5 referrers</div>
            <div className="divide-y divide-slate-100">
              {topReferrers.map(([orgId, count], i) => (
                <div key={orgId} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-semibold text-[var(--navy-900)]">
                    {i === 0 && "🥇 "}
                    {i === 1 && "🥈 "}
                    {i === 2 && "🥉 "}
                    {orgNameById.get(orgId) || "Unknown"}
                  </span>
                  <span className="text-[var(--green-600)] font-mono font-bold">{count} referrals</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Product engagement */}
      <Card title="⚡ Product Engagement" description="Last 7 days of activity across all orgs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat label="Docs extracted" value={docs.count ?? 0} />
          <MiniStat label="Campaigns run" value={campaigns.data?.length || 0} />
          <MiniStat label="Refund tracks" value={refundTracks.data?.length || 0} />
          <MiniStat label="AI msgs this week" value={aiGeneratedThisWeek} accent="green" />
        </div>
      </Card>

      {/* Health */}
      <Card title="🩺 Account Health" description="Watch list for retention">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat label="Canceled (all-time)" value={canceled.data?.length || 0} accent={(canceled.data?.length || 0) > 0 ? "amber" : undefined} />
          <MiniStat label="Inactive paid (14d+)" value={inactivePaid} accent={inactivePaid > 0 ? "amber" : undefined} />
          <MiniStat label="Pending invites" value={(invitations.data || []).filter((i) => i.status === "pending").length} />
          <MiniStat label="Outbound msgs (week)" value={outboundSentByPreparer} />
        </div>
        {inactivePaid > 0 && (
          <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
            ⚠️ {inactivePaid} paid account{inactivePaid > 1 ? "s have" : " has"} had no activity in 14+ days. Consider reaching out.
          </div>
        )}
      </Card>

      <div className="text-xs text-center text-[var(--text-muted)] mt-8">
        Data live from Supabase · Refreshes every page load · Super-admin only
      </div>
    </div>
  );
}

// =========================================
// UI components
// =========================================

function BigStat({ label, value, hint, accent }: { label: string; value: string; hint: string; accent?: "green" | "gold" }) {
  const valueCls =
    accent === "green" ? "text-[var(--green-600)]" : accent === "gold" ? "text-[var(--gold)]" : "text-[var(--navy-900)]";
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] mb-1">{label}</div>
      <div className={`text-4xl font-extrabold ${valueCls}`}>{value}</div>
      <div className="text-xs text-[var(--text-muted)] mt-2">{hint}</div>
    </div>
  );
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
      <div className="mb-4">
        <h2 className="font-bold text-[var(--navy-900)]">{title}</h2>
        {description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number | string; accent?: "green" | "gold" | "amber" }) {
  const valueCls =
    accent === "green"
      ? "text-[var(--green-600)]"
      : accent === "gold"
      ? "text-[var(--gold)]"
      : accent === "amber"
      ? "text-amber-700"
      : "text-[var(--navy-900)]";
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
      <div className={`text-2xl font-extrabold ${valueCls}`}>{value}</div>
      <div className="text-xs text-[var(--text-muted)] mt-0.5">{label}</div>
    </div>
  );
}

function FunnelRow({
  stage,
  count,
  percentOfPrev,
  percentOfTotal,
  highlight,
}: {
  stage: string;
  count: number;
  percentOfPrev: number;
  percentOfTotal: number;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-3 ${highlight ? "border-t-2 border-[var(--green-500)]" : "border-t border-slate-100"}`}>
      <div>
        <div className="font-semibold text-[var(--navy-900)]">{stage}</div>
        <div className="text-xs text-[var(--text-muted)]">{percentOfTotal}% of total signups</div>
      </div>
      <div className="text-right">
        <div className={`text-2xl font-extrabold ${highlight ? "text-[var(--green-600)]" : "text-[var(--navy-900)]"}`}>{count}</div>
        <div className="text-xs text-[var(--text-muted)]">{percentOfPrev}% of previous step</div>
      </div>
    </div>
  );
}

function TierRow({
  tier,
  count,
  totalPaid,
  annualRevenue,
}: {
  tier: string;
  count: number;
  totalPaid: number;
  annualRevenue: number;
}) {
  const pct = totalPaid > 0 ? Math.round((count / totalPaid) * 100) : 0;
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
      <div className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] mb-1">{tier} founders</div>
      <div className="text-2xl font-extrabold text-[var(--navy-900)]">{count}</div>
      <div className="text-xs text-[var(--text-muted)] mt-0.5">{pct}% of paid</div>
      <div className="text-xs text-[var(--green-600)] font-bold mt-1">
        ${Math.round(annualRevenue).toLocaleString()}/yr ARR
      </div>
    </div>
  );
}
