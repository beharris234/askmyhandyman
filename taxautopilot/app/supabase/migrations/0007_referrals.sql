-- ============================================================
-- TaxAutopilot — Phase 7: Referral Program
-- ============================================================
-- Each organization gets a unique referral code at signup.
-- When a new org signs up with that code:
--   - $250 credit added to the referrer's referral_credit_balance
--   - $250 first-year discount applied to the referee
-- Credits stack and are applied at renewal time, capped at the
-- full renewal price (so 10 referrals = free year, no overshoot).
-- ============================================================

-- Generate a short, brandable code from an org name.
create or replace function generate_referral_code(org_name text) returns text as $$
declare
  base text;
  suffix text;
  attempt text;
  exists_count int;
begin
  base := upper(regexp_replace(org_name, '[^a-zA-Z0-9]', '', 'g'));
  base := substring(base from 1 for 8);
  if length(base) < 3 then base := 'OFFICE'; end if;

  for i in 1..10 loop
    suffix := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 4));
    attempt := base || '-' || suffix;
    select count(*) into exists_count from organizations where referral_code = attempt;
    if exists_count = 0 then return attempt; end if;
  end loop;
  return base || '-' || upper(substring(md5(random()::text) from 1 for 8));
end;
$$ language plpgsql;

-- ---------- Extend organizations ----------
alter table organizations
  add column referral_code text unique,
  add column referred_by_org_id uuid references organizations(id) on delete set null,
  add column referral_credit_balance numeric(10, 2) not null default 0,
  add column referral_credit_lifetime numeric(10, 2) not null default 0;

comment on column organizations.referral_credit_balance is
  'Unused credits available for next renewal';
comment on column organizations.referral_credit_lifetime is
  'Total credits ever earned (audit / leaderboard stat)';

-- Backfill referral codes for any existing orgs
update organizations set referral_code = generate_referral_code(name) where referral_code is null;
alter table organizations alter column referral_code set not null;

-- Auto-assign referral code on insert
create or replace function ensure_referral_code() returns trigger as $$
begin
  if new.referral_code is null then
    new.referral_code := generate_referral_code(new.name);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_organizations_referral_code
  before insert on organizations
  for each row execute function ensure_referral_code();

-- ---------- REFERRALS (tracking table) ----------
create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_org_id uuid not null references organizations(id) on delete cascade,
  referee_org_id uuid not null references organizations(id) on delete cascade,
  referral_code text not null,

  status text not null default 'signed_up',
  referee_first_year_discount numeric(10, 2) not null default 250,
  referrer_credit_awarded numeric(10, 2) not null default 250,
  credit_applied boolean not null default false,

  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  applied_at timestamptz
);

comment on column referrals.status is
  'signed_up | qualified | applied | reversed';
comment on column referrals.qualified_at is
  'Set when referee becomes a paying customer (Phase 8 = Stripe)';

create unique index referrals_unique_pair on referrals(referrer_org_id, referee_org_id);
create index referrals_referrer_idx on referrals(referrer_org_id, created_at desc);
create index referrals_referee_idx on referrals(referee_org_id);

-- ---------- CREDIT LEDGER (audit) ----------
create table referral_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  referral_id uuid references referrals(id) on delete set null,
  amount numeric(10, 2) not null,
  reason text not null,
  balance_after numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

comment on column referral_credit_ledger.reason is
  'referral_earned | renewal_applied | manual_adjustment | reversal';

create index ledger_org_idx on referral_credit_ledger(organization_id, created_at desc);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Award credit + write to ledger + update balance atomically.
create or replace function award_referral_credit(
  p_org_id uuid,
  p_amount numeric,
  p_reason text,
  p_referral_id uuid default null
) returns numeric as $$
declare
  new_balance numeric;
begin
  update organizations
  set
    referral_credit_balance = referral_credit_balance + p_amount,
    referral_credit_lifetime = referral_credit_lifetime + greatest(p_amount, 0)
  where id = p_org_id
  returning referral_credit_balance into new_balance;

  insert into referral_credit_ledger (organization_id, referral_id, amount, reason, balance_after)
  values (p_org_id, p_referral_id, p_amount, p_reason, new_balance);

  return new_balance;
end;
$$ language plpgsql security definer;

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

alter table referrals enable row level security;

-- Referrer can see their outgoing referrals; referee can see who referred them
create policy "select own referrals" on referrals for select to authenticated
  using (
    referrer_org_id = current_org_id()
    or referee_org_id = current_org_id()
  );
create policy "insert referrals on signup" on referrals for insert to authenticated
  with check (referee_org_id = current_org_id());

alter table referral_credit_ledger enable row level security;

create policy "select own ledger" on referral_credit_ledger for select to authenticated
  using (organization_id = current_org_id());
