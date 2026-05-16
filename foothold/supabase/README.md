# Foothold — Supabase

## Apply the initial migration

### Option A: Supabase Dashboard (easiest)

1. Create a new project at https://supabase.com/dashboard (free tier).
2. Open **SQL Editor** → **New query**.
3. Paste the contents of `migrations/20260516000001_waitlist.sql` and run.
4. Verify the `waitlist` table exists under **Table Editor**.

### Option B: Supabase CLI

```bash
npm install -g supabase
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## Get your keys

In the Supabase dashboard:

- **Project URL** → Settings → API → `Project URL`
- **Publishable key** (anon) → Settings → API → `Project API keys` → `anon` / `public`

Paste both into:

- `../landing/.env.local`
- `../mobile/.env.local`

## RLS notes

The `waitlist` table allows anonymous INSERTs only — anyone with the publishable key can sign up, but nobody can read or modify entries via the public API. To list signups, use the Supabase dashboard or a server-side script with the service role key (never expose service role in client code).
