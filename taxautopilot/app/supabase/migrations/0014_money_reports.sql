-- ============================================================
-- TaxAutopilot — Phase 10: Money Report ("Audit") feature
-- ============================================================
-- The killer conversion tool. Free audit shows the prospect their
-- specific dollar losses, locks the fix behind subscribe.

create table money_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  generated_by uuid references profiles(id) on delete set null,

  status text not null default 'generating',
  findings jsonb not null default '{}'::jsonb,
  total_opportunity numeric(10, 2) not null default 0,
  ai_summary text,

  client_count integer not null default 0,
  documents_count integer not null default 0,
  emails_count integer not null default 0,

  created_at timestamptz not null default now(),
  completed_at timestamptz
);

comment on column money_reports.status is 'generating | complete | failed';
comment on column money_reports.findings is
  'JSON keyed by category: lapsed_clients, amendable_returns, quarterly_opportunities, irs_notices, offseason_silence, email_backlog. Each has count + estimated_value.';

create index money_reports_org_idx on money_reports(organization_id, created_at desc);

alter table money_reports enable row level security;

create policy "select own money reports" on money_reports for select to authenticated
  using (organization_id = current_org_id());
create policy "insert own money reports" on money_reports for insert to authenticated
  with check (organization_id = current_org_id());
create policy "update own money reports" on money_reports for update to authenticated
  using (organization_id = current_org_id());
