-- ============================================================
-- TaxAutopilot — Phase 9: Stripe Billing
-- ============================================================
-- Stores per-org Stripe customer/subscription state. Webhook
-- handler keeps this in sync with Stripe events. Referral credits
-- get applied as Stripe customer balance reductions at invoice
-- time (handled in the webhook).
-- ============================================================

alter table organizations
  add column stripe_customer_id text unique,
  add column stripe_subscription_id text,
  add column subscription_status text not null default 'inactive',
  add column tier text not null default 'solo',
  add column current_period_end timestamptz,
  add column trial_ends_at timestamptz;

comment on column organizations.subscription_status is
  'inactive | trialing | active | past_due | canceled | incomplete';
comment on column organizations.tier is 'solo | growth | office | enterprise';

create index organizations_stripe_customer_idx on organizations(stripe_customer_id);
create index organizations_subscription_status_idx on organizations(subscription_status);

-- ---------- PAYMENT EVENTS (audit log of all Stripe webhook events) ----------
create table payment_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  stripe_event_id text unique not null,
  event_type text not null,
  raw_payload jsonb not null,
  processed_at timestamptz not null default now()
);

comment on column payment_events.stripe_event_id is
  'Stripe event ID for idempotency — we never process the same event twice';

create index payment_events_org_idx on payment_events(organization_id, processed_at desc);
create index payment_events_type_idx on payment_events(event_type);

-- ---------- INVOICE CREDITS (track which referral credit was used on which invoice) ----------
alter table referral_credit_ledger
  add column stripe_invoice_id text;

comment on column referral_credit_ledger.stripe_invoice_id is
  'When reason=renewal_applied, the Stripe invoice that consumed this credit';
