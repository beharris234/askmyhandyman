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
