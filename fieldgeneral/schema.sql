-- FieldGeneral — Supabase schema (Phase 0: the hot dog stand)
-- Run in Supabase Dashboard → SQL Editor, or via the Supabase MCP apply_migration.
-- Stack: Postgres + Supabase Auth. Coach is the customer; players never log in
-- with a password (they use a per-player access token link), parent-visible.

-- ---------- COACHES (profile row per auth user) ----------
create table if not exists coaches (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  team_name   text,
  created_at  timestamptz default now()
);

-- ---------- VOICE PROFILE (the coach's tone, set once) ----------
create table if not exists voice_profiles (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references coaches(id) on delete cascade,
  tone_notes  text,
  examples    jsonb default '[]'::jsonb,   -- 3-5 example texts in the coach's voice
  sign_off    text,                        -- e.g. "— Coach Harris"
  updated_at  timestamptz default now(),
  unique (coach_id)
);

-- ---------- PLAYERS (roster) ----------
create table if not exists players (
  id             uuid primary key default gen_random_uuid(),
  coach_id       uuid not null references coaches(id) on delete cascade,
  full_name      text not null,
  position       text,                        -- one of QB,RB,WR,OL,DL,LB,DB,ST
  position_group text,                        -- mirror of position group key
  parent_contact text,                        -- parent email/phone (parent visibility)
  access_token   text unique not null,        -- player opens player.html?t=<token>
  created_at     timestamptz default now()
);

-- ---------- DAILY MESSAGES (one per coach/date/position group) ----------
create table if not exists daily_messages (
  id             uuid primary key default gen_random_uuid(),
  coach_id       uuid not null references coaches(id) on delete cascade,
  for_date       date not null,
  position_group text not null,
  message_text   text,
  workout        jsonb default '[]'::jsonb,
  nutrition      text,
  status         text default 'draft',        -- draft | sent
  source         text,                        -- local | claude
  created_at     timestamptz default now(),
  unique (coach_id, for_date, position_group)
);

-- ---------- CHECK-INS (one per player/date) ----------
create table if not exists checkins (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  for_date      date not null,
  lift_done     boolean default false,
  ate_right     boolean default false,
  film_watched  boolean default false,
  updated_at    timestamptz default now(),
  unique (player_id, for_date)
);

-- ============================================================
--  ROW LEVEL SECURITY
--  Coaches see only their own data. Players reach their own
--  row + check-ins through their access_token (handled in the
--  app via the token; for Phase 1 we move player reads behind
--  an Edge Function so the token is verified server-side).
-- ============================================================
alter table coaches        enable row level security;
alter table voice_profiles enable row level security;
alter table players        enable row level security;
alter table daily_messages enable row level security;
alter table checkins       enable row level security;

-- Coach owns their coach row
create policy "coach self"        on coaches        for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "coach voice"       on voice_profiles for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);
create policy "coach players"     on players        for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);
create policy "coach messages"    on daily_messages for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);
create policy "coach checkins"    on checkins       for all using (
  exists (select 1 from players p where p.id = checkins.player_id and p.coach_id = auth.uid())
);

-- NOTE (Phase 1 security gate): player.html currently reads/writes with the anon
-- key using the access_token. Before real student data goes in, move player reads
-- and check-in writes into a Supabase Edge Function that validates the token
-- server-side, and add parent-consent + athletic-trainer routing tables.

-- ---------- Seed: nothing required. Workouts are generated. ----------
