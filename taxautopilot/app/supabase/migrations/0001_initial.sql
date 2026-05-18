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
