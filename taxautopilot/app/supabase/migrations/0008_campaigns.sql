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
