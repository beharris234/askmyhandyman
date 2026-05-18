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
