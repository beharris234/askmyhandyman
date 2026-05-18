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
