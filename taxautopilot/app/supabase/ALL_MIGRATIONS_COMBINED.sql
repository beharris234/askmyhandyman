-- ============================================================
-- TaxAutopilot — Initial Schema
-- Phase 2: Multi-tenant foundation (organizations, users, clients,
-- documents, extractions) with strict Row-Level Security so one
-- tax office can NEVER see another office's data.
-- ============================================================

-- ---------- ORGANIZATIONS (tax offices) ----------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  software text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table organizations is 'A tax office. Each office is a tenant.';
comment on column organizations.software is 'Which tax software they use: drake, crosslink-online, crosslink-desktop, lacerte, proseries, ultratax, taxwise, taxslayer, other';

-- ---------- PROFILES (extends auth.users) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  full_name text,
  email text,
  role text not null default 'preparer',
  created_at timestamptz not null default now()
);

comment on column profiles.role is 'owner | admin | preparer';

-- ---------- CLIENTS (the taxpayers the office serves) ----------
create table clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  ssn_last4 text,
  status text not null default 'active',
  notes text,
  last_filed_year text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column clients.status is 'active | archived | lapsed';
create index clients_org_idx on clients(organization_id);
create index clients_status_idx on clients(organization_id, status);

-- ---------- DOCUMENTS (uploaded tax docs) ----------
create table documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  uploaded_by uuid references profiles(id) on delete set null,
  file_name text,
  file_path text,
  mime_type text,
  size_bytes integer,
  document_type text,
  tax_year text,
  extraction_status text not null default 'pending',
  created_at timestamptz not null default now()
);

comment on column documents.extraction_status is 'pending | processing | complete | failed';
create index documents_org_idx on documents(organization_id);
create index documents_client_idx on documents(client_id);

-- ---------- EXTRACTIONS (results from the AI engine) ----------
create table extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  result jsonb not null,
  confidence text,
  warnings jsonb default '[]'::jsonb,
  elapsed_ms integer,
  tokens_input integer,
  tokens_output integer,
  created_at timestamptz not null default now()
);

create index extractions_document_idx on extractions(document_id);
create index extractions_org_idx on extractions(organization_id);

-- ============================================================
-- HELPER FUNCTION: current user's organization
-- Used by every RLS policy to scope queries to the user's office
-- ============================================================
create or replace function current_org_id() returns uuid as $$
  select organization_id from profiles where id = auth.uid()
$$ language sql stable security definer;

-- ============================================================
-- ROW-LEVEL SECURITY POLICIES
-- These run inside the database itself. Even if our app has a
-- bug, the DB will refuse cross-org queries. This is the most
-- important security boundary in the entire system.
-- ============================================================

-- ORGANIZATIONS: members see their own; signup creates one
alter table organizations enable row level security;

create policy "select own organization"
  on organizations for select
  to authenticated
  using (id = current_org_id());

create policy "insert organization (anyone signed in)"
  on organizations for insert
  to authenticated
  with check (true);

create policy "update own organization (owner only)"
  on organizations for update
  to authenticated
  using (
    id = current_org_id()
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner'
    )
  );

-- PROFILES: see self and orgmates
alter table profiles enable row level security;

create policy "select own profile or orgmate"
  on profiles for select
  to authenticated
  using (
    id = auth.uid()
    or organization_id = current_org_id()
  );

create policy "insert own profile"
  on profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "update own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid());

-- CLIENTS: scoped to organization
alter table clients enable row level security;

create policy "select org clients"
  on clients for select
  to authenticated
  using (organization_id = current_org_id());

create policy "insert org clients"
  on clients for insert
  to authenticated
  with check (organization_id = current_org_id());

create policy "update org clients"
  on clients for update
  to authenticated
  using (organization_id = current_org_id());

create policy "delete org clients"
  on clients for delete
  to authenticated
  using (organization_id = current_org_id());

-- DOCUMENTS: scoped to organization
alter table documents enable row level security;

create policy "select org documents"
  on documents for select
  to authenticated
  using (organization_id = current_org_id());

create policy "insert org documents"
  on documents for insert
  to authenticated
  with check (organization_id = current_org_id());

create policy "update org documents"
  on documents for update
  to authenticated
  using (organization_id = current_org_id());

create policy "delete org documents"
  on documents for delete
  to authenticated
  using (organization_id = current_org_id());

-- EXTRACTIONS: scoped to organization
alter table extractions enable row level security;

create policy "select org extractions"
  on extractions for select
  to authenticated
  using (organization_id = current_org_id());

create policy "insert org extractions"
  on extractions for insert
  to authenticated
  with check (organization_id = current_org_id());

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at columns
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_organizations_updated_at before update on organizations
  for each row execute function set_updated_at();

create trigger trg_clients_updated_at before update on clients
  for each row execute function set_updated_at();

-- Auto-create profile row on signup
create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
-- ============================================================
-- TaxAutopilot — Phase 3 Schema: Inbox Intelligence
-- Stores per-org email provider connections (Gmail/Outlook) plus
-- a record of every email we've processed so we never double-
-- process and we have a full inbox UI.
-- ============================================================

-- ---------- EMAIL CONNECTIONS ----------
create table email_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  provider text not null,
  email_address text not null,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz,
  last_synced_at timestamptz,
  last_history_id text,
  status text not null default 'active',
  scopes text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column email_connections.provider is 'gmail | outlook';
comment on column email_connections.status is 'active | error | disconnected';

create unique index email_connections_org_provider_addr_idx
  on email_connections(organization_id, provider, email_address);
create index email_connections_org_idx on email_connections(organization_id);

-- ---------- PROCESSED EMAILS ----------
create table processed_emails (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  connection_id uuid not null references email_connections(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  provider_message_id text not null,
  thread_id text,
  sender_email text,
  sender_name text,
  subject text,
  snippet text,
  received_at timestamptz,
  has_attachments boolean not null default false,
  attachment_count integer not null default 0,
  ai_classification text,
  ai_summary text,
  ai_suggested_action text,
  documents_created integer not null default 0,
  status text not null default 'processed',
  error_message text,
  created_at timestamptz not null default now()
);

comment on column processed_emails.ai_classification is 'document_submission | question | irs_notice | scheduling | spam | other';
comment on column processed_emails.status is 'processed | needs_action | replied | skipped';

create unique index processed_emails_message_idx
  on processed_emails(connection_id, provider_message_id);
create index processed_emails_org_received_idx
  on processed_emails(organization_id, received_at desc);
create index processed_emails_client_idx
  on processed_emails(client_id);

-- Trigger to update email_connections.updated_at
create trigger trg_email_connections_updated_at before update on email_connections
  for each row execute function set_updated_at();

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

alter table email_connections enable row level security;

create policy "select org email connections"
  on email_connections for select
  to authenticated
  using (organization_id = current_org_id());

create policy "insert org email connections"
  on email_connections for insert
  to authenticated
  with check (organization_id = current_org_id());

create policy "update org email connections"
  on email_connections for update
  to authenticated
  using (organization_id = current_org_id());

create policy "delete org email connections"
  on email_connections for delete
  to authenticated
  using (organization_id = current_org_id());

alter table processed_emails enable row level security;

create policy "select org processed emails"
  on processed_emails for select
  to authenticated
  using (organization_id = current_org_id());

create policy "insert org processed emails"
  on processed_emails for insert
  to authenticated
  with check (organization_id = current_org_id());

create policy "update org processed emails"
  on processed_emails for update
  to authenticated
  using (organization_id = current_org_id());
-- ============================================================
-- TaxAutopilot — Phase 3.6: IMAP support for universal email
-- ============================================================
-- Adds fields needed to store IMAP server settings + encrypted
-- passwords. OAuth providers (gmail, outlook) ignore these.

alter table email_connections
  add column imap_host text,
  add column imap_port integer,
  add column imap_secure boolean,
  add column imap_password_encrypted text;

comment on column email_connections.imap_password_encrypted is
  'AES-256-GCM encrypted password, base64-encoded. Only used for provider=imap.';

-- The existing unique index already handles (org, provider, email)
-- so an org can have multiple IMAP inboxes from the same provider
-- under different addresses.
-- ============================================================
-- TaxAutopilot — Phase 4: Client Comms (SMS + AI drafting)
-- ============================================================

-- ---------- TWILIO PHONE NUMBERS (one per org) ----------
create table twilio_numbers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  account_sid text not null,
  auth_token_encrypted text not null,
  phone_number text not null,
  friendly_name text,
  webhook_secret text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column twilio_numbers.phone_number is 'E.164 format, e.g. +15551234567';
comment on column twilio_numbers.status is 'active | error | disconnected';

create unique index twilio_numbers_org_phone_idx
  on twilio_numbers(organization_id, phone_number);

-- ---------- CONVERSATIONS (one per client+channel) ----------
create table conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  channel text not null,
  external_address text not null,
  display_name text,
  last_message_at timestamptz,
  last_message_preview text,
  unread_count integer not null default 0,
  ai_mode text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column conversations.channel is 'sms | email';
comment on column conversations.external_address is 'phone (E.164) or email address';
comment on column conversations.ai_mode is 'draft | auto | off — does AI draft, auto-send, or stay quiet';

create unique index conversations_org_channel_addr_idx
  on conversations(organization_id, channel, external_address);
create index conversations_client_idx on conversations(client_id);
create index conversations_org_last_msg_idx
  on conversations(organization_id, last_message_at desc);

-- ---------- MESSAGES (individual sms/email) ----------
create table messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  channel text not null,
  direction text not null,
  external_message_id text,
  from_address text,
  to_address text,
  body text not null,
  ai_generated boolean not null default false,
  ai_confidence text,
  status text not null default 'received',
  sent_by uuid references profiles(id) on delete set null,
  error_message text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on column messages.direction is 'inbound | outbound';
comment on column messages.status is 'received | draft | queued | sent | delivered | failed';
comment on column messages.ai_confidence is 'high | medium | low (only for ai_generated drafts)';

create index messages_conv_created_idx on messages(conversation_id, created_at);
create index messages_org_created_idx on messages(organization_id, created_at desc);

-- ============================================================
-- TRIGGERS
-- ============================================================

create trigger trg_twilio_numbers_updated_at before update on twilio_numbers
  for each row execute function set_updated_at();

create trigger trg_conversations_updated_at before update on conversations
  for each row execute function set_updated_at();

-- When a message is inserted, bump the conversation's last_message_at + preview
create or replace function bump_conversation_on_message() returns trigger as $$
begin
  update conversations
  set
    last_message_at = new.created_at,
    last_message_preview = left(new.body, 200),
    unread_count = case
      when new.direction = 'inbound' then unread_count + 1
      else unread_count
    end,
    updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_messages_bump_conversation after insert on messages
  for each row execute function bump_conversation_on_message();

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

alter table twilio_numbers enable row level security;

create policy "select org twilio" on twilio_numbers for select to authenticated
  using (organization_id = current_org_id());
create policy "insert org twilio" on twilio_numbers for insert to authenticated
  with check (organization_id = current_org_id());
create policy "update org twilio" on twilio_numbers for update to authenticated
  using (organization_id = current_org_id());
create policy "delete org twilio" on twilio_numbers for delete to authenticated
  using (organization_id = current_org_id());

alter table conversations enable row level security;

create policy "select org conv" on conversations for select to authenticated
  using (organization_id = current_org_id());
create policy "insert org conv" on conversations for insert to authenticated
  with check (organization_id = current_org_id());
create policy "update org conv" on conversations for update to authenticated
  using (organization_id = current_org_id());

alter table messages enable row level security;

create policy "select org messages" on messages for select to authenticated
  using (organization_id = current_org_id());
create policy "insert org messages" on messages for insert to authenticated
  with check (organization_id = current_org_id());
create policy "update org messages" on messages for update to authenticated
  using (organization_id = current_org_id());
-- ============================================================
-- TaxAutopilot — Phase 5: Refund Tracking + Scheduled Alerts
-- ============================================================
-- One refund_track per (client, tax_year) — supports amendments
-- as separate rows. Scheduled_messages is a queue the cron drains
-- daily. Status changes are audited in refund_status_history.

-- ---------- REFUND TRACKS ----------
create table refund_tracks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,

  tax_year text not null,
  filed_date date not null,
  refund_amount numeric(10, 2),
  amount_owed numeric(10, 2),
  filing_status text,
  refund_method text not null default 'direct_deposit',
  bank_last4 text,

  current_status text not null default 'filed',
  status_updated_at timestamptz not null default now(),

  expected_acceptance_date date,
  expected_refund_date date,

  alerts_enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column refund_tracks.filing_status is 'single | mfj | mfs | hoh | qss';
comment on column refund_tracks.refund_method is 'direct_deposit | check';
comment on column refund_tracks.current_status is
  'filed | accepted | rejected | processing | refund_approved | refund_sent | received | issue';

create index refund_tracks_org_idx on refund_tracks(organization_id);
create index refund_tracks_client_idx on refund_tracks(client_id);
create unique index refund_tracks_unique_per_year on refund_tracks(client_id, tax_year);

-- ---------- SCHEDULED MESSAGES (queue for cron) ----------
create table scheduled_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  refund_track_id uuid references refund_tracks(id) on delete cascade,

  channel text not null default 'sms',
  template_id text not null,
  body text not null,
  scheduled_for timestamptz not null,

  status text not null default 'pending',
  sent_at timestamptz,
  sent_message_id uuid references messages(id) on delete set null,
  skip_reason text,
  error_message text,

  created_at timestamptz not null default now()
);

comment on column scheduled_messages.status is 'pending | sent | skipped | failed | cancelled';

create index scheduled_messages_due_idx
  on scheduled_messages(status, scheduled_for)
  where status = 'pending';
create index scheduled_messages_org_idx on scheduled_messages(organization_id);
create index scheduled_messages_track_idx on scheduled_messages(refund_track_id);

-- ---------- STATUS HISTORY (audit log) ----------
create table refund_status_history (
  id uuid primary key default gen_random_uuid(),
  refund_track_id uuid not null references refund_tracks(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  from_status text,
  to_status text not null,
  notes text,
  source text not null default 'manual',
  changed_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on column refund_status_history.source is 'manual | scheduled | wmr | client_reply | desktop_agent';

create index refund_status_history_track_idx
  on refund_status_history(refund_track_id, created_at desc);

-- ============================================================
-- TRIGGERS
-- ============================================================

create trigger trg_refund_tracks_updated_at before update on refund_tracks
  for each row execute function set_updated_at();

-- When refund_track status changes, log it to history
create or replace function log_refund_status_change() returns trigger as $$
begin
  if new.current_status is distinct from old.current_status then
    insert into refund_status_history (refund_track_id, organization_id, from_status, to_status, source)
    values (new.id, new.organization_id, old.current_status, new.current_status, 'manual');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_refund_status_change after update on refund_tracks
  for each row execute function log_refund_status_change();

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

alter table refund_tracks enable row level security;

create policy "select org refund tracks" on refund_tracks for select to authenticated
  using (organization_id = current_org_id());
create policy "insert org refund tracks" on refund_tracks for insert to authenticated
  with check (organization_id = current_org_id());
create policy "update org refund tracks" on refund_tracks for update to authenticated
  using (organization_id = current_org_id());
create policy "delete org refund tracks" on refund_tracks for delete to authenticated
  using (organization_id = current_org_id());

alter table scheduled_messages enable row level security;

create policy "select org sched messages" on scheduled_messages for select to authenticated
  using (organization_id = current_org_id());
create policy "insert org sched messages" on scheduled_messages for insert to authenticated
  with check (organization_id = current_org_id());
create policy "update org sched messages" on scheduled_messages for update to authenticated
  using (organization_id = current_org_id());
create policy "delete org sched messages" on scheduled_messages for delete to authenticated
  using (organization_id = current_org_id());

alter table refund_status_history enable row level security;

create policy "select org refund history" on refund_status_history for select to authenticated
  using (organization_id = current_org_id());
create policy "insert org refund history" on refund_status_history for insert to authenticated
  with check (organization_id = current_org_id());
-- ============================================================
-- TaxAutopilot — Phase 4.5: Email Reply Sending
-- ============================================================

-- ---------- SMTP fields on email_connections ----------
-- Used when provider='imap' so we can send via SMTP too.
-- OAuth providers (gmail/outlook) ignore these.
alter table email_connections
  add column smtp_host text,
  add column smtp_port integer,
  add column smtp_secure boolean;

-- ---------- Reply tracking on processed_emails ----------
alter table processed_emails
  add column reply_draft text,
  add column reply_draft_confidence text,
  add column reply_draft_needs_human boolean default false,
  add column reply_message_id uuid references messages(id) on delete set null,
  add column reply_sent_at timestamptz;

comment on column processed_emails.reply_draft is
  'AI-generated reply text, ready for tax pro to edit and approve';
comment on column processed_emails.reply_message_id is
  'Points to the outbound row in messages once the reply is sent';
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
-- ============================================================
-- TaxAutopilot — Phase 7.5: Win-back Campaigns
-- ============================================================
-- A campaign is a one-shot outreach to a filtered subset of an
-- org's clients. The cron from Phase 5 already drains
-- scheduled_messages, so campaign messages slot into that queue.
-- ============================================================

-- ---------- CAMPAIGNS ----------
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  created_by uuid references profiles(id) on delete set null,

  name text not null,
  type text not null default 'winback',
  channel text not null default 'sms',

  audience_criteria jsonb not null default '{}'::jsonb,
  audience_count integer not null default 0,
  ai_personalize boolean not null default true,
  message_template text,

  status text not null default 'draft',

  launched_at timestamptz,
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column campaigns.type is
  'winback | reactivation | review_request | quarterly_estimate | custom';
comment on column campaigns.channel is 'sms | email | both';
comment on column campaigns.status is
  'draft | launched | sending | complete | paused | failed';
comment on column campaigns.audience_criteria is
  'JSON: { lapsed_years_min, status, has_phone, has_email, ... }';

create index campaigns_org_created_idx
  on campaigns(organization_id, created_at desc);

-- ---------- CAMPAIGN RECIPIENTS ----------
create table campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,

  channel text not null,
  rendered_subject text,
  rendered_body text,

  status text not null default 'pending',
  scheduled_message_id uuid references scheduled_messages(id) on delete set null,
  sent_message_id uuid references messages(id) on delete set null,

  skip_reason text,
  replied_at timestamptz,
  converted_at timestamptz,
  error_message text,

  created_at timestamptz not null default now()
);

comment on column campaign_recipients.status is
  'pending | queued | sent | replied | converted | skipped | failed';

create unique index campaign_recipients_unique
  on campaign_recipients(campaign_id, client_id, channel);
create index campaign_recipients_campaign_idx
  on campaign_recipients(campaign_id);
create index campaign_recipients_status_idx
  on campaign_recipients(campaign_id, status);

-- Link scheduled_messages and messages back to campaigns for analytics
alter table scheduled_messages
  add column campaign_recipient_id uuid references campaign_recipients(id) on delete set null;

alter table messages
  add column campaign_recipient_id uuid references campaign_recipients(id) on delete set null;

-- ============================================================
-- TRIGGERS
-- ============================================================

create trigger trg_campaigns_updated_at before update on campaigns
  for each row execute function set_updated_at();

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

alter table campaigns enable row level security;

create policy "select org campaigns" on campaigns for select to authenticated
  using (organization_id = current_org_id());
create policy "insert org campaigns" on campaigns for insert to authenticated
  with check (organization_id = current_org_id());
create policy "update org campaigns" on campaigns for update to authenticated
  using (organization_id = current_org_id());
create policy "delete org campaigns" on campaigns for delete to authenticated
  using (organization_id = current_org_id());

alter table campaign_recipients enable row level security;

create policy "select org recipients" on campaign_recipients for select to authenticated
  using (organization_id = current_org_id());
create policy "insert org recipients" on campaign_recipients for insert to authenticated
  with check (organization_id = current_org_id());
create policy "update org recipients" on campaign_recipients for update to authenticated
  using (organization_id = current_org_id());
-- ============================================================
-- TaxAutopilot — Phase 8A + 8C-lite: Team Invites + Per-Preparer
-- Email Scope
-- ============================================================

-- ---------- INVITATIONS ----------
create table invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role text not null default 'preparer',
  token text unique not null,
  status text not null default 'pending',
  invited_by uuid references profiles(id) on delete set null,
  accepted_by uuid references profiles(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

comment on column invitations.role is 'owner | admin | preparer';
comment on column invitations.status is 'pending | accepted | expired | revoked';

create unique index invitations_org_email_pending
  on invitations(organization_id, email)
  where status = 'pending';
create index invitations_token_idx on invitations(token);
create index invitations_org_idx on invitations(organization_id, created_at desc);

-- ---------- Per-preparer scope on email_connections ----------
-- If preparer_id is NULL → connection is office-wide (everyone in
--   the org sees it and can act on its messages).
-- If preparer_id is set → connection is personal — only that user
--   sees it.
alter table email_connections
  add column preparer_id uuid references profiles(id) on delete cascade,
  add column visibility text not null default 'office';

comment on column email_connections.preparer_id is
  'Null = office-wide. Set = personal to this preparer.';
comment on column email_connections.visibility is
  'office | personal — derived from preparer_id but explicit for queries';

-- ============================================================
-- ROW-LEVEL SECURITY (extending existing)
-- ============================================================

alter table invitations enable row level security;

create policy "select org invitations" on invitations for select to authenticated
  using (organization_id = current_org_id());

create policy "insert org invitations (owner/admin only)"
  on invitations for insert to authenticated
  with check (
    organization_id = current_org_id()
    and exists (
      select 1 from profiles
      where id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy "update org invitations" on invitations for update to authenticated
  using (organization_id = current_org_id());

-- Special policy: allow the invitee to look up an invitation by token
-- (needed during the accept flow before they're a member of the org)
create policy "lookup own invitation by token"
  on invitations for select
  to authenticated
  using (true);

-- Tighten email_connections RLS: personal ones are only visible to
-- the preparer who owns them. Drop and recreate the SELECT policy.
drop policy if exists "select org email connections" on email_connections;

create policy "select email connections (respect scope)"
  on email_connections for select to authenticated
  using (
    organization_id = current_org_id()
    and (
      preparer_id is null
      or preparer_id = auth.uid()
      or exists (
        select 1 from profiles
        where id = auth.uid() and role in ('owner', 'admin')
      )
    )
  );
-- ============================================================
-- TaxAutopilot — Phase 8B + 8E: Client Assignment to Preparers
-- ============================================================
-- Each client can have an "assigned preparer" (the person
-- responsible for them). Unassigned = office-wide queue.
-- DB still lets everyone in the org see all clients (so people
-- can cover for each other), but the UI defaults to filtering
-- by current user for preparers.
-- ============================================================

alter table clients
  add column assigned_preparer_id uuid references profiles(id) on delete set null;

create index clients_assigned_preparer_idx
  on clients(organization_id, assigned_preparer_id);

comment on column clients.assigned_preparer_id is
  'Which preparer owns this client. Null = unassigned / office queue.';

-- Auto-assign on insert: if assigned_preparer_id wasn't set,
-- assign to the current user (the person who created the client)
-- only if they're a preparer (not an owner — owners often add
-- clients on behalf of the team and don't want them auto-assigned).
create or replace function auto_assign_client_on_insert() returns trigger as $$
declare
  creator_role text;
begin
  if new.assigned_preparer_id is null then
    select role into creator_role from profiles where id = auth.uid();
    if creator_role = 'preparer' then
      new.assigned_preparer_id := auth.uid();
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_clients_auto_assign
  before insert on clients
  for each row execute function auto_assign_client_on_insert();
-- ============================================================
-- TaxAutopilot — Phase 8C: Per-Preparer Twilio Numbers
-- ============================================================
-- Each office can connect multiple Twilio numbers. A number can
-- be tied to a specific preparer (their personal SMS line) or
-- left office-wide. Incoming SMS routes to the right preparer's
-- queue based on which number it landed on.
-- ============================================================

alter table twilio_numbers
  add column preparer_id uuid references profiles(id) on delete set null,
  add column visibility text not null default 'office';

comment on column twilio_numbers.preparer_id is
  'Null = office-wide. Set = this preparer''s personal SMS line.';
comment on column twilio_numbers.visibility is 'office | personal';

create index twilio_numbers_preparer_idx
  on twilio_numbers(organization_id, preparer_id);

-- Track which preparer "owns" each conversation, derived from the
-- number it arrived on. Lets us filter the messages list per preparer.
alter table conversations
  add column owning_preparer_id uuid references profiles(id) on delete set null;

create index conversations_owning_preparer_idx
  on conversations(organization_id, owning_preparer_id);

comment on column conversations.owning_preparer_id is
  'Which preparer this conversation belongs to. Null = office queue.';

-- Rewrite the Twilio number RLS SELECT policy to respect scope
-- (personal numbers only visible to their owning preparer + admins/owners).
drop policy if exists "select org twilio" on twilio_numbers;

create policy "select org twilio (scope aware)"
  on twilio_numbers for select to authenticated
  using (
    organization_id = current_org_id()
    and (
      preparer_id is null
      or preparer_id = auth.uid()
      or exists (
        select 1 from profiles
        where id = auth.uid() and role in ('owner', 'admin')
      )
    )
  );
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
-- ============================================================
-- TaxAutopilot — Phase 9.5: Onboarding state on profiles
-- ============================================================
-- Tracks whether each user has seen the welcome modal so we don't
-- nag them every dashboard visit.

alter table profiles
  add column onboarded_at timestamptz;
