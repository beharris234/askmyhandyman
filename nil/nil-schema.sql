-- ============================================================
-- NILocal — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor (or via migration)
-- Then paste your project URL + anon key into nil-config.js.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---- Athlete signups / directory ----------------------------
create table if not exists public.nil_athletes (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text not null,
  phone       text,
  sport       text not null,
  school      text,
  city        text,
  followers   integer default 0,
  handle      text,
  bio         text,
  deals       text[] default '{}',
  rate        numeric default 0,
  verified    boolean default false,
  approved    boolean default false,   -- flip to true to show in the public directory
  created_at  timestamptz default now()
);

-- ---- Business leads / deal requests -------------------------
create table if not exists public.nil_businesses (
  id                uuid primary key default uuid_generate_v4(),
  business          text not null,
  contact           text,
  email             text not null,
  phone             text,
  city              text,
  budget            numeric default 0,
  deals             text[] default '{}',
  sport             text,
  notes             text,
  requested_athlete text,
  created_at        timestamptz default now()
);

-- ============================================================
-- Row Level Security
--   * Anyone (anon key) may INSERT a signup — that's the public form.
--   * Anyone may SELECT only APPROVED athletes for the directory.
--   * Business leads are NOT publicly readable (no select policy).
--   * You review/approve rows from the Supabase dashboard (service role).
-- ============================================================
alter table public.nil_athletes  enable row level security;
alter table public.nil_businesses enable row level security;

drop policy if exists nil_athletes_insert on public.nil_athletes;
create policy nil_athletes_insert on public.nil_athletes
  for insert to anon, authenticated with check (true);

drop policy if exists nil_athletes_select_approved on public.nil_athletes;
create policy nil_athletes_select_approved on public.nil_athletes
  for select to anon, authenticated using (approved = true);

drop policy if exists nil_businesses_insert on public.nil_businesses;
create policy nil_businesses_insert on public.nil_businesses
  for insert to anon, authenticated with check (true);
-- (intentionally no SELECT policy on nil_businesses — leads stay private)

create index if not exists nil_athletes_sport_idx on public.nil_athletes (sport);
create index if not exists nil_athletes_city_idx  on public.nil_athletes (city);
