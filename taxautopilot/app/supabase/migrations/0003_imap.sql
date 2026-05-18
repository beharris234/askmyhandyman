-- ============================================================
-- TaxAutopilot — Phase 3.6: IMAP support for universal email
-- ============================================================
-- Adds fields needed to store IMAP server settings + encrypted
-- passwords. OAuth providers (gmail, outlook) ignore these.

alter table email_connections
  add column imap_host text,
  add column imap_port integer,
  add column imap_secure boolean,
  add column imap_password_encrypted text;

comment on column email_connections.imap_password_encrypted is
  'AES-256-GCM encrypted password, base64-encoded. Only used for provider=imap.';

-- The existing unique index already handles (org, provider, email)
-- so an org can have multiple IMAP inboxes from the same provider
-- under different addresses.
