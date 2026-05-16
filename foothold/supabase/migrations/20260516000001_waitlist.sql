-- Foothold: initial waitlist schema
-- Apply this migration in the Supabase SQL Editor or via the Supabase CLI.

create extension if not exists "pgcrypto";

create table public.waitlist (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  medication    text,
  phase         text,
  source        text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create unique index waitlist_email_unique on public.waitlist (lower(email));
create index        waitlist_created_at_idx on public.waitlist (created_at desc);

alter table public.waitlist enable row level security;

-- Anonymous visitors can sign up for the waitlist (INSERT only).
-- Reads/updates/deletes are blocked at the API level; only service role can access.
create policy "anyone_can_join_waitlist"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (
    email is not null
    and length(email) between 5 and 320
    and email like '%_@_%._%'
  );
