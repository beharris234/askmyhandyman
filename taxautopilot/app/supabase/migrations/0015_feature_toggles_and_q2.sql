-- ============================================================
-- TaxAutopilot — Phase 12: Feature Toggles + Q2 Product Features
-- ============================================================
-- 1. Per-org feature toggles (add/delete/pause functions per office)
-- 2. Bilingual AI (preferred_language on clients)
-- 3. Document Request Automation (document_requests table)
-- 4. Year-End Client Summary (year_end_summaries table)
-- ============================================================

-- ---------- 1. FEATURE TOGGLES ----------
-- Stored as JSONB on the org so we can add new features without
-- migrations. Default = all on.

alter table organizations
  add column feature_settings jsonb not null default '{
    "refund_alerts": true,
    "win_back_campaigns": true,
    "ai_email_drafting": true,
    "ai_sms_drafting": true,
    "document_extraction": true,
    "inbox_processing": true,
    "money_report": true,
    "client_portal": false,
    "year_end_summary": true,
    "document_requests": true,
    "bilingual_ai": true,
    "appointment_booking": false,
    "esignature": false,
    "quickbooks_sync": false
  }'::jsonb;

comment on column organizations.feature_settings is
  'Per-org feature toggles. Owner controls which features are active.';

-- ---------- 2. BILINGUAL AI: language preference per client ----------
alter table clients
  add column preferred_language text not null default 'en';

comment on column clients.preferred_language is
  'ISO 639-1 language code. en (default), es (Spanish), vi (Vietnamese), zh (Chinese), etc. AI uses this for drafted replies.';

create index clients_language_idx on clients(organization_id, preferred_language);

-- ---------- 3. DOCUMENT REQUESTS ----------
create table document_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  requested_by uuid references profiles(id) on delete set null,

  doc_types text[] not null,
  notes text,
  channel text not null default 'sms',

  status text not null default 'sent',
  sent_at timestamptz not null default now(),
  received_at timestamptz,
  reminded_at timestamptz,
  reminder_count integer not null default 0,

  message_id uuid references messages(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column document_requests.doc_types is
  'Array of doc types requested. e.g. {"W-2", "1099-NEC", "ID"}';
comment on column document_requests.channel is 'sms | email';
comment on column document_requests.status is 'sent | partial | received | overdue | canceled';

create index doc_requests_org_idx on document_requests(organization_id, status);
create index doc_requests_client_idx on document_requests(client_id);
create index doc_requests_overdue_idx
  on document_requests(status, sent_at)
  where status = 'sent';

create trigger trg_doc_requests_updated_at before update on document_requests
  for each row execute function set_updated_at();

alter table document_requests enable row level security;

create policy "select org doc requests" on document_requests for select to authenticated
  using (organization_id = current_org_id());
create policy "insert org doc requests" on document_requests for insert to authenticated
  with check (organization_id = current_org_id());
create policy "update org doc requests" on document_requests for update to authenticated
  using (organization_id = current_org_id());

-- ---------- 4. YEAR-END CLIENT SUMMARIES ----------
create table year_end_summaries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,

  tax_year text not null,
  refund_amount numeric(10, 2),
  amount_owed numeric(10, 2),
  filing_status text,
  documents_processed integer not null default 0,
  ai_messages_handled integer not null default 0,

  highlights jsonb default '[]'::jsonb,
  ai_summary text,

  status text not null default 'draft',
  sent_at timestamptz,

  created_at timestamptz not null default now()
);

comment on column year_end_summaries.highlights is
  'Array of {label, value} pairs — what the client wants to see at year end';
comment on column year_end_summaries.status is 'draft | sent | viewed';

create unique index year_end_unique on year_end_summaries(client_id, tax_year);
create index year_end_org_idx on year_end_summaries(organization_id, tax_year);

alter table year_end_summaries enable row level security;

create policy "select org year end" on year_end_summaries for select to authenticated
  using (organization_id = current_org_id());
create policy "insert org year end" on year_end_summaries for insert to authenticated
  with check (organization_id = current_org_id());
create policy "update org year end" on year_end_summaries for update to authenticated
  using (organization_id = current_org_id());
