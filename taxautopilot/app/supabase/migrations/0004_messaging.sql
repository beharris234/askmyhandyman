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
