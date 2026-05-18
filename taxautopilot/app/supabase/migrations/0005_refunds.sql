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
