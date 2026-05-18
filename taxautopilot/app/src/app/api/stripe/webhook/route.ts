import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Stripe sends events here. Verify the signature, dedupe by event ID,
 * and update org subscription state to match.
 *
 * In Stripe Dashboard:
 *   Developers → Webhooks → Add endpoint
 *   URL: <NEXT_PUBLIC_APP_URL>/api/stripe/webhook
 *   Events: checkout.session.completed, customer.subscription.updated,
 *           customer.subscription.deleted, invoice.payment_succeeded,
 *           invoice.payment_failed
 *   Copy "Signing secret" → STRIPE_WEBHOOK_SECRET in .env.local
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { ok: false, error: "stripe_not_configured" },
      { status: 500 }
    );
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 400 });

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `signature_invalid: ${err instanceof Error ? err.message : "?"}` },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Idempotency check — never process the same event twice
  const { data: existing } = await supabase
    .from("payment_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  let orgId: string | null = null;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        orgId = (session.metadata?.organization_id as string) || null;
        if (orgId && session.subscription) {
          const subId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await applySubscription(supabase, orgId, sub, (session.metadata?.tier as string) || "solo");
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        orgId = (sub.metadata?.organization_id as string) || null;
        if (orgId) {
          await applySubscription(supabase, orgId, sub, (sub.metadata?.tier as string) || "solo");
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        orgId = (sub.metadata?.organization_id as string) || null;
        if (orgId) {
          await supabase
            .from("organizations")
            .update({
              subscription_status: "canceled",
              stripe_subscription_id: null,
            })
            .eq("id", orgId);
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as unknown as { subscription?: string | null }).subscription;
        if (typeof subId === "string") {
          const sub = await stripe.subscriptions.retrieve(subId);
          orgId = (sub.metadata?.organization_id as string) || null;
          if (orgId) {
            // Apply referral credits on next invoice render
            await applyReferralCreditsToCustomer(supabase, orgId, invoice);
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as unknown as { subscription?: string | null }).subscription;
        if (typeof subId === "string") {
          const sub = await stripe.subscriptions.retrieve(subId);
          orgId = (sub.metadata?.organization_id as string) || null;
          if (orgId) {
            await supabase
              .from("organizations")
              .update({ subscription_status: "past_due" })
              .eq("id", orgId);
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe-webhook] handler failed:", err);
  }

  await supabase.from("payment_events").insert({
    organization_id: orgId,
    stripe_event_id: event.id,
    event_type: event.type,
    raw_payload: event as unknown as object,
  });

  return NextResponse.json({ ok: true });
}

type SbClient = ReturnType<typeof createServiceClient>;

async function applySubscription(
  supabase: SbClient,
  orgId: string,
  sub: Stripe.Subscription,
  tier: string
) {
  const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
  await supabase
    .from("organizations")
    .update({
      stripe_subscription_id: sub.id,
      subscription_status: sub.status,
      tier,
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
    })
    .eq("id", orgId);
}

/**
 * When an invoice is paid, check if the org has referral credits and
 * apply them as a Stripe customer balance reduction for next invoice.
 * Logs to referral_credit_ledger so we know which invoice they hit.
 */
async function applyReferralCreditsToCustomer(
  supabase: SbClient,
  orgId: string,
  invoice: Stripe.Invoice
) {
  const { data: org } = await supabase
    .from("organizations")
    .select("referral_credit_balance, stripe_customer_id")
    .eq("id", orgId)
    .single();
  if (!org || !org.stripe_customer_id) return;

  const balanceCents = Math.round(Number(org.referral_credit_balance) * 100);
  if (balanceCents <= 0) return;

  // Apply as negative balance — credits future invoices
  const stripe = getStripe();
  await stripe.customers.createBalanceTransaction(org.stripe_customer_id, {
    amount: -balanceCents,
    currency: "usd",
    description: `TaxAutopilot referral credits applied (${balanceCents / 100} USD)`,
  });

  // Zero out the balance + record in ledger
  await supabase
    .from("organizations")
    .update({ referral_credit_balance: 0 })
    .eq("id", orgId);

  await supabase.from("referral_credit_ledger").insert({
    organization_id: orgId,
    amount: -Number(org.referral_credit_balance),
    reason: "renewal_applied",
    balance_after: 0,
    stripe_invoice_id: invoice.id,
  });
}

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );
}
