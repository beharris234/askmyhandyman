# Foothold — Landing

Next.js 14 marketing site + waitlist capture for Foothold.

## Local setup

```bash
cd foothold/landing
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key
npm run dev                  # http://localhost:3000
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project → Import** this repo.
3. Set **Root Directory** to `foothold/landing`.
4. Add env vars in **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy. Point `foothold.health` at the Vercel project once the domain is registered.

## Structure

```
app/
  layout.tsx               Global shell, metadata, fonts
  page.tsx                 Hero + pillars + footer
  globals.css              Tailwind + brand component classes
  api/waitlist/route.ts    POST endpoint — inserts into Supabase `waitlist`
components/
  WaitlistForm.tsx         Client form (email + optional med + phase)
lib/
  supabase.ts              Browser/server client factory
```

## Prereqs

- Apply `../supabase/migrations/20260516000001_waitlist.sql` to your Supabase project before going live, or the waitlist endpoint will return 500s on insert.
