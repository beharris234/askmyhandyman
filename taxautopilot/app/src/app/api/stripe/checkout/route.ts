import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getTier, tierConfigured, type Tier } from "@/lib/stripe-tiers";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Stripe not configured. Set STRIPE_SECRET_KEY in .env.local." },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, full_name, email, organizations(id, name, stripe_customer_id)")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id) {
    return NextResponse.json({ ok: false, error: "no_organization" }, { status: 400 });
  }

  const orgRaw = profile.organizations as unknown;
  const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as
    | { id: string; name: string; stripe_customer_id: string | null }
    | null;
  if (!org) return NextResponse.json({ ok: false, error: "org_missing" }, { status: 500 });

  const form = await request.formData();
  const tierId = (String(form.get("tier") || "solo") as Tier);
  const tier = getTier(tierId);
  if (!tierConfigured(tier)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Tier "${tier.id}" missing Stripe price ID. Set STRIPE_PRICE_${tier.id.toUpperCase()} in .env.local.`,
      },
      { status: 500 }
    );
  }

  const stripe = getStripe();

  // Reuse existing customer or create one
  let customerId = org.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email || user.email,
      name: profile.full_name || undefined,
      metadata: {
        organization_id: org.id,
        organization_name: org.name,
      },
    });
    customerId = customer.id;
    await supabase
      .from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", org.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: tier.stripePriceId!, quantity: 1 }],
    success_url: `${appUrl}/settings/billing?checkout=success`,
    cancel_url: `${appUrl}/settings/billing?checkout=canceled`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: {
        organization_id: org.id,
        tier: tier.id,
      },
    },
    metadata: {
      organization_id: org.id,
      tier: tier.id,
    },
  });

  return NextResponse.json({ ok: true, url: session.url });
}
