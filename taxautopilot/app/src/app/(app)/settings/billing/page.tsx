import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isStripeConfigured } from "@/lib/stripe";
import { TIERS, formatPrice, tierConfigured, type Tier } from "@/lib/stripe-tiers";
import { isManager } from "@/lib/permissions";
import { CheckoutButton } from "./CheckoutButton";
import { PortalButton } from "./PortalButton";

type SearchParams = Promise<{ checkout?: string }>;

export default async function BillingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id, organizations(name, tier, subscription_status, current_period_end, stripe_customer_id, referral_credit_balance)")
    .eq("id", user!.id)
    .single();

  const orgRaw = profile?.organizations as unknown;
  const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as
    | {
        name: string;
        tier: string;
        subscription_status: string;
        current_period_end: string | null;
        stripe_customer_id: string | null;
        referral_credit_balance: number;
      }
    | null;

  const canManage = isManager(profile?.role);
  const isActive = ["active", "trialing"].includes(org?.subscription_status || "");
  const stripeReady = isStripeConfigured();

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <Link
        href="/settings"
        className="text-sm text-[var(--text-muted)] hover:text-[var(--navy-900)] mb-4 inline-block"
      >
        ← Back to settings
      </Link>

      <h1 className="text-3xl font-extrabold text-[var(--navy-900)] tracking-tight mb-1">
        Billing
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        {canManage
          ? "Lock in Founders Pricing or manage your subscription."
          : "Only owners and admins can manage billing."}
      </p>

      {/* Status banner */}
      {params.checkout === "success" && (
        <div className="mb-6 rounded-lg bg-[var(--green-100)] border border-[var(--green-500)]/30 px-4 py-3 text-sm text-[var(--green-600)] font-semibold">
          ✓ Subscription activated! It may take a moment to reflect below.
        </div>
      )}
      {params.checkout === "canceled" && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Checkout canceled. You can try again any time below.
        </div>
      )}
      {!stripeReady && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <strong>Heads up:</strong> Stripe isn&apos;t configured yet. Add{" "}
          <code className="font-mono text-xs">STRIPE_SECRET_KEY</code> and the
          three <code className="font-mono text-xs">STRIPE_PRICE_*</code> IDs to{" "}
          <code className="font-mono text-xs">.env.local</code>, then restart the
          server. Setup steps in <code className="font-mono text-xs">.env.local.example</code>.
        </div>
      )}

      {/* Current subscription */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h2 className="font-bold text-[var(--navy-900)]">Current plan</h2>
          <StatusPill status={org?.subscription_status || "inactive"} />
        </div>

        {isActive ? (
          <div>
            <div className="text-2xl font-extrabold text-[var(--navy-900)] mb-1">
              {TIERS[org!.tier as Tier]?.name || "Active"}
            </div>
            {org?.current_period_end && (
              <div className="text-sm text-[var(--text-muted)]">
                Renews {new Date(org.current_period_end).toLocaleDateString()}
              </div>
            )}
            {Number(org?.referral_credit_balance || 0) > 0 && (
              <div className="mt-3 text-sm">
                🎁 <strong className="text-[var(--green-600)]">
                  {formatPrice(Math.round(Number(org!.referral_credit_balance) * 100))}
                </strong>{" "}
                referral credit will auto-apply on your next renewal.
              </div>
            )}
            {canManage && org?.stripe_customer_id && (
              <div className="mt-4">
                <PortalButton />
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="text-lg font-bold text-[var(--text-muted)] mb-1">
              No active subscription
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {canManage
                ? "Pick a tier below to lock in Founders Pricing for life."
                : "Ask your office owner to activate the subscription."}
            </p>
          </div>
        )}
      </div>

      {/* Plan selector — show only if not active or upgrading */}
      {canManage && stripeReady && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-[var(--navy-900)] mb-1">
            {isActive ? "Change your plan" : "Lock in Founders Pricing"}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-5">
            Locked rate for life. Cancel anytime in the customer portal.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["solo", "growth", "office"] as Tier[]).map((tierId) => {
              const tier = TIERS[tierId];
              const isCurrent = org?.tier === tierId && isActive;
              const configured = tierConfigured(tier);
              return (
                <div
                  key={tierId}
                  className={`rounded-xl border-2 p-4 ${
                    isCurrent
                      ? "border-[var(--green-500)] bg-[var(--green-100)]/30"
                      : "border-slate-200"
                  }`}
                >
                  <div className="font-bold text-[var(--navy-900)]">{tier.name}</div>
                  <div className="text-2xl font-extrabold text-[var(--navy-900)] my-2">
                    {formatPrice(tier.priceCents)}
                    <span className="text-xs text-[var(--text-muted)] font-normal">/yr</span>
                  </div>
                  <ul className="text-xs text-[var(--text-muted)] space-y-1 mb-3">
                    <li>· {tier.maxPreparers ?? "∞"} preparer{tier.maxPreparers === 1 ? "" : "s"}</li>
                    <li>· {tier.maxClients ? `${tier.maxClients} clients` : "Unlimited clients"}</li>
                    <li>· {tier.smsLinesIncluded} SMS line{tier.smsLinesIncluded === 1 ? "" : "s"}</li>
                  </ul>
                  {isCurrent ? (
                    <div className="text-xs font-bold text-[var(--green-600)] text-center py-2">
                      ✓ Your current plan
                    </div>
                  ) : !configured ? (
                    <div className="text-[10px] text-amber-700 text-center py-2">
                      Set STRIPE_PRICE_{tier.id.toUpperCase()}
                    </div>
                  ) : (
                    <CheckoutButton tierId={tier.id} label={isActive ? "Switch" : "Subscribe"} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-xs text-[var(--text-muted)]">
            🛡 60-day money-back guarantee. Powered by Stripe — your card is never touched by us.
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Active", cls: "bg-[var(--green-100)] text-[var(--green-600)]" },
    trialing: { label: "Trial", cls: "bg-[var(--gold-light)] text-amber-900" },
    past_due: { label: "Past Due", cls: "bg-red-100 text-red-700" },
    canceled: { label: "Canceled", cls: "bg-slate-100 text-slate-600" },
    inactive: { label: "Inactive", cls: "bg-slate-100 text-slate-600" },
    incomplete: { label: "Incomplete", cls: "bg-amber-100 text-amber-700" },
  };
  const meta = map[status] || map.inactive;
  return (
    <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${meta.cls}`}>
      {meta.label}
    </span>
  );
}
