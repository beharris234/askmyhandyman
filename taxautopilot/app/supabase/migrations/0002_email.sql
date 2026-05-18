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
